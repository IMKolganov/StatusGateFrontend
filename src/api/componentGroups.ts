/**
 * Hand-maintained until next `npm run api:sync`.
 * Component groups CRUD + public nested groups.
 */
export interface ComponentGroupCreate {
  project_id: string
  name: string
  slug: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface ComponentGroupUpdate {
  name?: string
  slug?: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface ComponentGroupResponse {
  id: string
  project_id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedComponentGroupResponse {
  items: ComponentGroupResponse[]
  total: number
  offset: number
  limit: number
  has_next: boolean
  has_previous: boolean
}

export interface PublicServiceGroupStatus {
  id?: string | null
  name: string
  sort_order?: number
  services: import('./generated/models/publicServiceStatus').PublicServiceStatus[]
}
