/////////////////////////////////////////////////////////////////////////////////
//20240704 chg to get rid of mobile white space on right side 
////////////////////////////////////////////////////////////////////////////////
'use client';
import { useEffect, useState } from 'react';
import { CallToAction } from '@/components/CallToAction';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { PrimaryFeatures } from '@/components/PrimaryFeatures';
import { SecondaryFeatures } from '@/components/SecondaryFeatures';
import { Testimonials } from '@/components/Testimonials';
import { CallToActionCalc } from '@/components/CallToAction_Calc';

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false); // Added type boolean to useState

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024 || window.innerHeight < 768);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Header />
      <main className="main-container">
        <Hero />
        <PrimaryFeatures />
        <SecondaryFeatures />
        <CallToAction />
        <Testimonials />
        <CallToActionCalc />
      </main>
      <Footer />

      <style jsx>{`
        .main-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 16px; /* Adjust padding as needed */
        }

        @media (min-width: 1024px) {
          .main-container {
            padding: 0 32px; /* Larger padding for larger screens */
          }
        }
      `}</style>
    </>
  );
};

export default Home;
