import { LogBox } from 'react-native'
import Root from './src/Root'

// Suppress API error warnings from appearing as red banners
LogBox.ignoreLogs([
  'Failed to fetch',
  'ApiError',
  '[API Error]',
])

export default function Underboss() {
  return <Root/>
}
