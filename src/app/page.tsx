// import { CallToAction } from '@/components/CallToAction'
// import { Footer } from '@/components/Footer'
// import { Header } from '@/components/Header'
// import { Hero } from '@/components/Hero'
// import { PrimaryFeatures } from '@/components/PrimaryFeatures'
// import { SecondaryFeatures } from '@/components/SecondaryFeatures'
// import { Testimonials } from '@/components/Testimonials'
// import { CallToActionCalc } from '@/components/CallToAction_Calc'

// export default function Home() {
//   return (
//     <>
//       <Header />
//       <main>
//         <Hero />
//         <PrimaryFeatures />
//         <SecondaryFeatures />
//         <CallToAction />
//         <Testimonials /> 
//         <CallToActionCalc />  
//       </main>
//       <Footer />
//     </>
//   )
// }

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

//20240704 handle screensize issues 
interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024 || window.innerHeight < 768); // Adjust these values as needed
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Header />
      <main style={isSmallScreen ? { display: 'flex', flexDirection: 'column', alignItems: 'center' } : {}}>
        <Hero />
        <PrimaryFeatures />
        <SecondaryFeatures />
        <CallToAction />
        <Testimonials />
        <CallToActionCalc />
      </main>
      <Footer />
    </>
  );
};

export default Home;

