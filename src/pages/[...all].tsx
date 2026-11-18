import { Link } from 'react-router-dom'
import { APP_NAME } from '../constants'
import { Hero } from '../components/Hero'
import { buttonVariants } from '../components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <title>{`Not found · ${APP_NAME}`}</title>
      <meta name="robots" content="noindex" />
      <Hero title="404" body="We couldn’t find that page.">
        <Link to="/" className={buttonVariants({ size: 'lg' })}>
          Go home
        </Link>
      </Hero>
    </div>
  )
}
