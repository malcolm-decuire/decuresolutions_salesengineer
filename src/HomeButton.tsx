//help guide user home after export pdf 
import React from 'react';
import Button from '@mui/material/Button';
import Link from 'next/link';

const HomeButton = () => {
  return (
    <Link href="/src/app/page.tsx" passHref>
      <Button variant="contained" color="primary">
        Home
      </Button>
    </Link>
  );
};

export default HomeButton;
