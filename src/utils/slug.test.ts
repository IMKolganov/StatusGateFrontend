import { describe, expect, it } from 'vitest'
import { slugFromName, slugify } from './slug'

describe('slugify', () => {
  it('lowercases and replaces non-alphanumerics with hyphens', () => {
    expect(slugify(' Hello World! ')).toBe('hello-world')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('---Foo---')).toBe('foo')
  })

  it('collapses consecutive separators', () => {
    expect(slugify('a___b***c')).toBe('a-b-c')
  })

  it('returns empty string for punctuation-only input', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('slugFromName', () => {
  it('returns slugified name when possible', () => {
    expect(slugFromName('My Project')).toBe('my-project')
  })

  it('uses default fallback when slugify is empty', () => {
    expect(slugFromName('***')).toBe('item')
  })

  it('accepts a custom fallback', () => {
    expect(slugFromName('@@@', 'project')).toBe('project')
  })
})
