import React from 'react'
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AiTools from '../components/AiTools';
import Testimonial from '../components/Testimonial';
import Billing from '../components/Billing';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <>
    <Navbar/>
    <Hero/>
    <AiTools/>
    <Testimonial/>
    <Billing/>
    <Footer/>
    </>
  )
}

export default Home;
