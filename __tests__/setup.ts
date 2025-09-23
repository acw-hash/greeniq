import { expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom'

beforeAll(() => {
  // Make expect available globally for jest-dom
  global.expect = expect
})
