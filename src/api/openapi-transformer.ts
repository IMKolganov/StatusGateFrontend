type OpenApiSchema = Record<string, unknown>
type ObjectSchema = {
  properties?: Record<string, OpenApiSchema>
  $ref?: string
}

type OpenApiDocument = {
  paths?: Record<string, Record<string, OpenApiOperation>>
  components?: { schemas?: Record<string, OpenApiSchema> }
}

type OpenApiOperation = {
  responses?: Record<string, { content?: Record<string, { schema?: OpenApiSchema }> }>
}

function schemaRefName(schema: OpenApiSchema | undefined): string | null {
  if (!schema || typeof schema !== 'object') return null
  const ref = schema.$ref
  if (typeof ref !== 'string') return null
  return ref.split('/').pop() ?? null
}

function asObjectSchema(schema: OpenApiSchema | undefined): ObjectSchema | undefined {
  if (!schema || typeof schema !== 'object') return undefined
  const properties = schema.properties
  if (properties !== undefined && typeof properties !== 'object') return undefined
  return { properties: properties as Record<string, OpenApiSchema> | undefined, $ref: schema.$ref as string | undefined }
}

function unwrapApiResponseSchema(
  schema: OpenApiSchema | undefined,
  schemas: Record<string, OpenApiSchema>,
): OpenApiSchema | undefined {
  const name = schemaRefName(schema)
  if (!name?.startsWith('ApiResponse_')) {
    return schema
  }

  const wrapper = asObjectSchema(schemas[name])
  const dataSchema = wrapper?.properties?.data
  if (!dataSchema) {
    return { type: 'null' }
  }

  return dataSchema
}

export default function transformOpenApi(document: OpenApiDocument): OpenApiDocument {
  const schemas = document.components?.schemas ?? {}

  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(pathItem)) {
      if (!operation.responses) continue

      for (const [statusCode, response] of Object.entries(operation.responses)) {
        const jsonContent = response.content?.['application/json']
        if (!jsonContent?.schema) continue

        if (statusCode.startsWith('2')) {
          jsonContent.schema = unwrapApiResponseSchema(jsonContent.schema, schemas) ?? jsonContent.schema
        }
      }
    }
  }

  return document
}
