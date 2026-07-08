import Image from 'next/image'

import { Main } from '@/components/elements/main'
import { GitHubIcon } from '@/components/icons/social/github-icon'
import { LinkedInIcon } from '@/components/icons/social/linkedin-icon'
import {
  FooterWithLinksAndSocialIcons,
  SocialLink,
} from '@/components/sections/footer-with-links-and-social-icons'
import {
  NavbarLink,
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from '@/components/sections/navbar-with-links-actions-and-centered-logo'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Malcolm Decuire: GTM SE',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://github.githubassets.com" />
        <link rel="stylesheet" href="https://github.githubassets.com/static/fonts/mona-sans.css" />
      </head>
      <body>
        <>
          <NavbarWithLinksActionsAndCenteredLogo
            id="navbar"
            links={
              <>
                <NavbarLink href="/#stats">About</NavbarLink>
                <NavbarLink href="/#case-studies">Case Studies</NavbarLink>
                <NavbarLink href="https://malcolm-decuire-portfolio-app-971002445190.us-central1.run.app/aidemo">Portfolio</NavbarLink>
                {/* <NavbarLink href="#" className="sm:hidden">
                  Log in
                </NavbarLink> */}
              </>
            }
            logo={
              <NavbarLogo href="/">
                <Image
                  src="/img/logos/oatmeal-instrument-color-mauve-950.svg"
                  alt="Oatmeal"
                  className="dark:hidden"
                  width={85}
                  height={28}
                />
                <Image
                  src="/img/logos/DECURESOLUTIONS-LOGO.png"
                  alt="Oatmeal"
                  className="not-dark:hidden"
                  width={85}
                  height={28}
                />
              </NavbarLogo>
            }
            actions={
              <>
                {/* intentionally left empty */}
              </>
            }
          />

          <Main>{children}</Main>

          <FooterWithLinksAndSocialIcons
            id="footer"
            links={<></>}
            fineprint="© 2026 Decure Solutions"
            socialLinks={
              <>
                <SocialLink href="https://github.com" name="GitHub">
                  <GitHubIcon />
                </SocialLink>
                <SocialLink href="https://www.linkedin.com/in/malcolmdecuire/" name="LinkedIn">
                  <LinkedInIcon />
                </SocialLink>
              </>
            }
          />
        </>
      </body>
    </html>
  )
}
