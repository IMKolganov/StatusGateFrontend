import { describe, expect, it } from 'vitest'
import transformOpenApi from './openapi-transformer'

describe('transformOpenApi', () => {
  it('unwraps ApiResponse_* schemas on 2xx JSON responses', () => {
    const document = {
      paths: {
        '/api/x': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ApiResponse_Item' },
                  },
                },
              },
              '400': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ApiResponse_Error' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ApiResponse_Item: {
            properties: {
              data: { $ref: '#/components/schemas/Item' },
            },
          },
          ApiResponse_Error: {
            properties: {
              data: { type: 'object' },
            },
          },
          Item: { type: 'object' },
        },
      },
    }

    const result = transformOpenApi(document)
    expect(result.paths!['/api/x']!.get!.responses!['200']!.content!['application/json']!.schema).toEqual({
      $ref: '#/components/schemas/Item',
    })
    expect(result.paths!['/api/x']!.get!.responses!['400']!.content!['application/json']!.schema).toEqual({
      $ref: '#/components/schemas/ApiResponse_Error',
    })
  })

  it('returns null schema when ApiResponse wrapper has no data property', () => {
    const document = {
      paths: {
        '/api/y': {
          get: {
            responses: {
              '204': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ApiResponse_Empty' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ApiResponse_Empty: { properties: {} },
        },
      },
    }

    const result = transformOpenApi(document)
    expect(result.paths!['/api/y']!.get!.responses!['204']!.content!['application/json']!.schema).toEqual({
      type: 'null',
    })
  })

  it('leaves non-ApiResponse refs and empty docs alone', () => {
    expect(transformOpenApi({})).toEqual({})
    const document = {
      paths: {
        '/api/z': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Plain' },
                  },
                },
              },
            },
          },
        },
      },
      components: { schemas: { Plain: { type: 'string' } } },
    }
    const result = transformOpenApi(document)
    expect(result.paths!['/api/z']!.get!.responses!['200']!.content!['application/json']!.schema).toEqual({
      $ref: '#/components/schemas/Plain',
    })
  })
})
