import Image from 'next/image'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-call-to-action.jpg'

export function CallToAction() {
  return (
    <section
      id="get-started-today"
      className="relative overflow-hidden bg-blue-600 py-32"
    >
      <Image
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        src={backgroundImage}
        alt=""
        width={2347}
        height={1244}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Book A Call
          </h2>
          <p className="mt-4 text-lg tracking-tight text-white">
            Let's talk through any GTM, pre-sales, or post-sales challenges your team is facing
          </p>
          <Button href="https://www.calendly.com/malcolm-decuire" color="white" className="mt-10">
            Calendly
          </Button>
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Delve into my nerdy interests. 
          </h2>
          <p className="mt-4 text-lg tracking-tight text-white">
            Discover world of interconnectivity, illuminated through a personal knowledge graph
          </p>
          <Button href="https://publish.obsidian.md/malcolm-decuire" color="white" className="mt-10">
            Obsidian Graph
          </Button>
        </div>
      </Container>
    </section>
  )
}


