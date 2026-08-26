import Image from 'next/image'

import { Main } from '@/components/elements/main'
import { GitHubIcon } from '@/components/icons/social/github-icon'
import { LinkedInIcon } from '@/components/icons/social/linkedin-icon'
import { FooterWithLinksAndSocialIcons, SocialLink } from '@/components/sections/footer-with-links-and-social-icons'
import {
  NavbarLink,
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from '@/components/sections/navbar-with-links-actions-and-centered-logo'

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <NavbarWithLinksActionsAndCenteredLogo
        id="navbar"
        links={
          <>
            <NavbarLink href="/#stats">About</NavbarLink>
            <NavbarLink href="/#case-studies">Case Studies</NavbarLink>
            <NavbarLink href="https://malcolm-decuire-portfolio-app-971002445190.us-central1.run.app/aidemo">
              Portfolio
            </NavbarLink>
          </>
        }
        logo={
          <NavbarLogo href="/">
            <Image
              src="/img/logos/oatmeal-instrument-color-mauve-950.svg"
              alt="Decure Solutions"
              className="dark:hidden"
              width={85}
              height={28}
            />
            <Image
              src="/img/logos/DECURESOLUTIONS-LOGO.png"
              alt="Decure Solutions"
              className="not-dark:hidden"
              width={85}
              height={28}
            />
          </NavbarLogo>
        }
        actions={<></>}
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
  )
}
