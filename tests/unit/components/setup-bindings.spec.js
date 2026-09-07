// @vitest-environment node
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

// In <script setup>, template resolution camelizes a tag before it capitalizes
// it, so a setup binding named after the tag is tried first. Vue only takes it
// when it is a function, because a function is a valid functional component:
// a ref of the same name is skipped and the component still wins. Task.vue
// declared `addComment` next to <add-comment>, so Vue rendered the function on
// every update and each render posted a comment.
const camelize = tag =>
  tag
    .split('-')
    .map((part, index) => (index ? part[0].toUpperCase() + part.slice(1) : part))
    .join('')

// Only bindings that hold a function shadow a component.
const FUNCTION_DECLARATIONS =
  /^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>|^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm

const componentTags = template =>
  new Set(
    [...template.matchAll(/<([a-z][a-z0-9]*(?:-[a-z0-9]+)+)[\s/>]/g)].map(
      match => match[1]
    )
  )

const functionNames = script =>
  new Set(
    [...script.matchAll(FUNCTION_DECLARATIONS)].map(
      match => match[1] ?? match[2]
    )
  )

const shadowedTags = source => {
  const setupAt = source.indexOf('<script setup>')
  if (setupAt === -1) return []
  const functions = functionNames(source.slice(setupAt))
  return [...componentTags(source.slice(0, setupAt))].filter(tag =>
    functions.has(camelize(tag))
  )
}

const files = execSync('git ls-files "src/**/*.vue"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)

describe('script setup bindings', () => {
  it('finds the components to scan', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it('never shadows a component tag with a setup function', () => {
    const offenders = files
      .map(file => ({ file, tags: shadowedTags(readFileSync(file, 'utf8')) }))
      .filter(entry => entry.tags.length > 0)
      .map(entry => `${entry.file}: ${entry.tags.join(', ')}`)

    expect(offenders).toEqual([])
  })
})
