import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { SEO } from '@/components/SEO';

// Define module titles array HERE
const moduleTitles = [
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Moddule",
  "Stay notified on updates to modules and new content that appears"
];

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Update document title
    document.title = "Courseware Platform";
    
    // You could also add meta description here if needed
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Courseware Platform');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Courseware Platform';
      document.head.appendChild(meta);
    }
  }, []);

  // Calculate pricing and savings
  const monthlyPrice = 4.99;
  const annualPrice = 44.99;
  const monthlySavingsPercentage = Math.round(100 - (annualPrice / (monthlyPrice * 12)) * 100);
  
  // Set document title on mount
  useEffect(() => {
    document.title = 'Courseware Platform - Home';
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="Courseware Platform - Welcome"
        description="About the Courseware Platform."
        canonicalPath="/"
      />
      
      <Navbar />

      {/* Hero Section */}
      <section className="text-center py-16 md:py-20 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
        Courseware Platform
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-300 mb-4">
          The online course for whatever you need to learn.
        </h2>
        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-3xl mx-auto">
          Learn how to use subject matter X using our platfor
        </p>
        <div className="space-y-4">
          <Button 
            className="bg-white text-black hover:bg-gray-100 text-base md:text-lg px-6 md:px-8 py-5 md:py-6"
            onClick={() => window.location.href = '/signin'}
          >
            Sign up for FREE now to access
          </Button>
        </div>
      </section>
      {/* Features Section - Reduced top padding */}
      <section id="features" className="pt-8 pb-16 md:pb-20 px-4"> {/* Reduced pt-* from py-16 */}
 
          <div className="flex justify-center mb-12 md:mb-16 px-4"> {/* Added px-4 for padding */}
            <img 
              src="https://pjviwnulenjexsxaqlxp.supabase.co/storage/v1/object/public/files//dashboard_overview.png" 
              alt="Dashboard Overview Screenshot" 
              className="max-w-full md:max-w-4xl rounded-lg shadow-lg border-4 border-gray-300" /* Added border */
            />
          </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">
          Everything You Need to Succeed with your subject matter
        </h2>
        <p className="text-gray-400 text-lg md:text-xl text-center mb-12 md:mb-16 max-w-3xl mx-auto">
        This platform is for you!  With all the pieces of the puzzle in one place, you'll be able to learn and apply your subject matter.
       </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="bg-gray-900 rounded-lg p-6 md:p-8">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3 md:mb-4">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ENHANCED Curriculum Overview Section - Styled Trigger */}
      <section id="curriculum" className="py-16 md:py-20 px-4 bg-gray-950">
        <div className="w-full max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
              {/* Style the Trigger like a card header */}
              <AccordionTrigger
                className="text-3xl md:text-4xl font-bold hover:no-underline w-full flex justify-between items-center bg-gray-900 rounded-lg p-6 border-2 border-blue-500 data-[state=open]:rounded-b-none data-[state=open]:border-b-transparent transition-all" /* Remove bottom border/rounding when open */
              >
                Explore the Full Curriculum
                {/* Default chevron icon is included automatically */}
              </AccordionTrigger>
              {/* Ensure content connects visually */}
              <AccordionContent className="p-0 mt-0 overflow-hidden"> {/* Added overflow-hidden */}
                {/* Style content body, remove top border/rounding */}
                <div className="w-full bg-gray-900 rounded-b-lg p-6 border-l-2 border-r-2 border-b-2 border-blue-500"> {/* Keep side/bottom borders */}
                  {moduleTitles.map((title, index) => (
                    <p key={title} className="text-base text-gray-300 py-1.5">
                      {`${index + 1}. ${title}`}
                    </p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section> {/* END of Curriculum Section */}
        
      {/* Pain Points Section */}
      <section className="py-16 md:py-20 px-4 bg-gray-900">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">
          More filler verbiage?
        </h2>
        <p className="text-gray-400 text-lg md:text-xl text-center mb-12 md:mb-16">
          You're not alone. Many non-technical and technical users struggle with these common challenges...
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
          {painPoints.map((point) => (
            <div key={point.title} className="bg-gray-800 rounded-lg p-6 md:p-8">
              <h3 className="text-xl font-bold mb-3 md:mb-4">"{point.title}"</h3>
              <p className="text-gray-400">{point.solution}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-20 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">
          Success Stories from our Early Access Users
        </h2>
        <p className="text-gray-400 text-lg md:text-xl text-center mb-12 md:mb-16">
          Here's what people are saying about our learning platform who have had an early preview.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-gray-900 rounded-lg p-6 md:p-8">
              <div className="flex items-center gap-4 mb-4 md:mb-6">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-gray-400">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-400 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 md:mb-6">
          Simple, Affordable Pricing
        </h2>
        <p className="text-gray-400 text-lg md:text-xl text-center mb-6">
          Unlock the full potential of the platform without breaking the bank.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {/* Free Tier */}
          <div className="bg-gray-900 rounded-lg p-6 md:p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="text-3xl font-bold mb-4">
              $0
              <span className="text-lg text-gray-400">/forever</span>
            </div>
            <p className="text-gray-400 mb-6">Get started with the basics</p>
            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Access to Module 1 only
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Online viewing only
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-600">✗</span>
                No additional modules
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-600">✗</span>
                No downloads
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/signin')}
            >
              Sign Up Free
            </Button>
          </div>
          
          {/* Monthly Tier */}
          <div className="bg-gray-900 rounded-lg p-6 md:p-8 flex flex-col border-2 border-blue-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Monthly</h3>
            <div className="text-3xl font-bold mb-4">
              $4.99
              <span className="text-lg text-gray-400">/month</span>
            </div>
            <p className="text-gray-400 mb-6">Full access, cancel anytime</p>
            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Access to all modules
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Online viewing only
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Progress Tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Future updates included
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-600">✗</span>
                No downloads
              </li>
            </ul>
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={() => navigate('/signin')}
            >
              Create your account
            </Button>
          </div>
          
          {/* Pro Tier */}
          <div className="bg-gray-900 rounded-lg p-6 md:p-8 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              Save {monthlySavingsPercentage}%
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="text-3xl font-bold mb-4">
              $44.99
              <span className="text-lg text-gray-400">/year</span>
            </div>
            <p className="text-gray-400 mb-6">Save {monthlySavingsPercentage}% vs monthly</p>
            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Access to all modules
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                PDF downloads available
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Community Access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Future updates included
              </li>
            </ul>
            <Button 
              className="w-full"
              onClick={() => navigate('/signin')}
            >
              Create your account
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-20 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 md:mb-6">
          Ready to use the platform?
        </h2>
        <p className="text-gray-400 text-lg md:text-xl text-center mb-8 md:mb-12">
          Get access to the learning platform today and start building amazing courseware without
          writing code.
        </p>
        <div className="text-center">
          <Button 
            className="bg-white text-black hover:bg-gray-100 text-base md:text-lg px-6 md:px-8 py-5 md:py-6"
            onClick={() => window.location.href = '/signin'}
          >
            Sign up for FREE now to access
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

// Data for the features section go here
const features = [
  {
    icon: "💻",
    title: "Save Time and Eliminate Frustration",
    description: "A ready-made platform for you to learn and apply your subject matter."
  },
  {
    icon: "🎯",
    title: "Save Time and Eliminate Frustration",
    description: "A ready-made platform for you to learn and apply your subject matter."
  },
  {
    icon: "🔐",
    title: "Save Time and Eliminate Frustration",
    description: "A ready-made platform for you to learn and apply your subject matter."
  },
  {
    icon: "🔄",
    title: "Save Time and Eliminate Frustration",
    description: "A ready-made platform for you to learn and apply your subject matter."
  },
  {
    icon: "💳",
    title: "Save Time and Eliminate Frustration",
    description: "A ready-made platform for you to learn and apply your subject matter."
  },
  {
    icon: "⭐",
    title: "Save Time and Eliminate Frustration",
    description: "A ready-made platform for you to learn and apply your subject matter."
  }
];
// user pain points go here
const painPoints = [
  {
    title: "I want to sell my knowledge is a custom courseware platform.",
    solution: "Our learning platform allows users to join, learn, and follow along with your courseware."
  },
  {
    title: "I want to sell my knowledge is a custom courseware platform.",
    solution: "Our learning platform allows users to join, learn, and follow along with your courseware."
  },
  {
    title: "I want to sell my knowledge is a custom courseware platform.",
    solution: "Our learning platform allows users to join, learn, and follow along with your courseware."
  },
  {
    title: "I want to sell my knowledge is a custom courseware platform.",
    solution: "Our learning platform allows users to join, learn, and follow along with your courseware."
  },
  {
    title: "I want to sell my knowledge is a custom courseware platform.",
    solution: "Our learning platform allows users to join, learn, and follow along with your courseware."
  }
];
// testimonials go here
const testimonials = [
  {
    initials: "SJ",
    name: "Sarah Johnson",
    role: "Marketing Professional",
    quote: "I was struggling to use subject matter X effectively until I found this learning platform. Now I'm doing great!"
  },
  {
    initials: "MT",
    name: "Mark Thompson",
    role: "Small Business Owner",
    quote: "This learning platform saved me countless hours of frustration. The section on prompting being a good person was worth 10x the price."
  },
  {
    initials: "AR",
    name: "Alex Rivera",
    role: "Freelance Designer",
    quote: "As someone with zero coding experience, this learning platform was a game changer. I've built a fully functional app for my clients!"
  }
];
// user faqs go here
const faqs = [
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
  {
    question: "What is this platform?",
    answer: "It's a great platform for you to learn and apply your subject matter.",
  },
]; 