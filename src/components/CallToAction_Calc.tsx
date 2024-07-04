import Image from 'next/image'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-call-to-action.jpg'


export function CallToActionCalc() {
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
            Fintech Tools To Demo 
          </h2>
          <p className="mt-4 text-lg tracking-tight text-white">
            I have an intense passion for multidiscplinary work with a clear commericial outcome. 
          </p>
          <p className="mt-4 text-lg tracking-tight text-white">
            Here's an example of how I work w/ developers & subject matter experts to develop free real estate tools. 
          </p>
          <Button href="/rent_calc" color="white" className="mt-5 sm:mt-10">
            Rent Calc.
          </Button>
          <div></div>
          <Button href="/investment_calc" color="white" className="mt-5 sm:mt-10">
            Invest. Calc.
          </Button>
          
        </div>
      </Container>
    </section>
  );
}
