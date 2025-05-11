import { useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Define the structure for a term
interface TermDefinition {
  term: string;
  definition: string;
  category?: string; // Optional category for grouping
}

// Initial list of terms (Replace entire array)
const terminologyList: TermDefinition[] = [
  {
    term: '.cursorignore',
    definition: 'Similar to .gitignore, but tells Cursor\'s AI features which files or folders to ignore when analyzing your project or generating code, keeping its context relevant.',
    category: 'Tools/Cursor'
  },
  {
    term: '.gitignore',
    definition: 'A configuration file for Git that lists files and folders (like `node_modules` or temporary files) that should *not* be tracked or saved in the project\'s history.',
    category: 'Tools/Git'
  },
  {
    term: '.gitkeep',
    definition: 'An empty file used as a trick to make Git track an otherwise empty folder, as Git normally ignores empty folders.',
    category: 'Tools/Git'
  },
  {
    term: 'API (Application Programming Interface)',
    definition: 'A way for different software programs to talk to each other. It defines the \"language\" and rules they use to request and share information.',
    category: 'Concepts'
  },
  {
    term: 'Backend',
    definition: 'The \"behind-the-scenes\" part of an application that runs on a server. It handles data storage, user logins, calculations, and provides information to the frontend.',
    category: 'Concepts/Backend'
  },
  {
    term: 'Bucket (Storage)',
    definition: 'A container for storing files (like images, videos, documents) in cloud storage services (like AWS S3 or Supabase Storage). Each bucket typically has a unique name.',
    category: 'Concepts/Cloud'
  },
  {
    term: 'Changelog',
    definition: 'A file that keeps a record of all notable changes made to a project over time, usually listing new features, bug fixes, and improvements for each version.',
    category: 'Concepts/Project Management'
  },
  {
    term: 'CI/CD (Continuous Integration / Continuous Deployment)',
    definition: 'An automated process for building, testing, and deploying software. CI automatically integrates code changes, and CD automatically deploys tested code, making releases faster and more reliable.',
    category: 'Concepts/Deployment'
  },
  {
    term: 'CNAME Flattening',
    definition: 'A DNS feature offered by some providers that makes it possible to point your main domain name (e.g., `yourdomain.com`) directly to another service\'s domain name, which isn\'t normally allowed.',
    category: 'Concepts/Deployment'
  },
  {
    term: 'Console Log',
    definition: 'A command developers use to print messages or variable values to a hidden \"console\" area (in the browser or server terminal) to help understand what\'s happening in the code, especially for debugging.',
    category: 'Concepts/Debugging'
  },
  {
    term: 'Container',
    definition: 'A lightweight, standalone, executable package of software that includes everything needed to run it: code, runtime, system tools, libraries, and settings. Docker is a popular tool for creating and managing containers.',
    category: 'Concepts/Deployment'
  },
  {
    term: 'CORS (Cross-Origin Resource Sharing)',
    definition: 'A browser security feature that controls which websites are allowed to request resources (like data from an API) from a different domain. Servers need to enable CORS for specific domains.',
    category: 'Concepts/Security'
  },
  {
    term: 'CSRF (Cross-Site Request Forgery)',
    definition: 'A type of web security attack where a malicious website tricks a user\'s browser into performing an unwanted action on a trusted site where the user is logged in. Websites use special tokens to prevent this.',
    category: 'Concepts/Security'
  },
  {
    term: 'Cursor',
    definition: 'An AI code editor that helps you build software faster by understanding your code and assisting with writing, debugging, and making changes, even with complex models like GPT-4.',
    category: 'Tools'
  },
  {
    term: 'Docker',
    definition: 'A platform for developing, shipping, and running applications inside \"containers\". It packages an application and all its dependencies together, ensuring it runs consistently across different environments.',
    category: 'Tools/Deployment'
  },
  {
    term: 'Environment Variables',
    definition: 'Configuration settings (like API keys or database passwords) stored outside the application code, making it easy to change settings for different environments (like development vs. production) without modifying the code itself.',
    category: 'Concepts/Deployment'
  },
  {
    term: 'Express.js',
    definition: 'A popular framework built on Node.js that makes it easier to create backend services and APIs (the parts that handle data and logic behind the scenes).',
    category: 'Backend'
  },
  {
    term: 'Frontend',
    definition: 'Everything the user sees and interacts with in their browser – the buttons, text, layout, and client-side interactivity of a website or app.',
    category: 'Concepts/Frontend'
  },
  {
    term: 'Git',
    definition: 'The standard tool for tracking changes in code projects (version control). It lets you save versions, go back to older versions, and collaborate with others.',
    category: 'Tools'
  },
  {
    term: 'GitHub',
    definition: 'A website that hosts Git repositories (projects). It\'s the most popular place for developers to store their code, collaborate, and manage projects.',
    category: 'Tools'
  },
  {
    term: 'Main Branch (or Master Branch)',
    definition: 'The primary, official version of the code in a Git repository, usually representing what is currently live and stable for users.',
    category: 'Concepts/Git'
  },
  {
    term: 'Middleware',
    definition: 'Code that runs on the server between receiving a request and sending a response. Often used for tasks like checking if a user is logged in, logging requests, or modifying data before it reaches the main application logic.',
    category: 'Concepts/Backend'
  },
  {
    term: 'Nginx',
    definition: 'A popular high-performance web server software. It\'s often used as a reverse proxy (directing traffic to backend services), load balancer (distributing traffic across servers), and for serving static files efficiently.',
    category: 'Backend/Tools'
  },
  {
    term: 'Node.js',
    definition: 'A technology that lets JavaScript (usually run in browsers) run on servers. This is essential for building the \"backend\" or \"server-side\" logic of web applications.',
    category: 'Backend'
  },
  {
    term: 'OAuth (e.g., Google Sign-In)',
    definition: 'An open standard for access delegation, commonly used for enabling third-party login (\"Sign in with Google/GitHub\"). It allows users to grant websites or applications access to their information on other platforms without sharing their passwords.',
    category: 'Concepts/Security'
  },
  {
    term: 'package.json',
    definition: 'A file found in Node.js/JavaScript projects that lists the project\'s details (name, version), its dependencies (other software packages it needs), and defines scripts for common tasks (like starting or building the project).',
    category: 'Concepts/Project Structure'
  },
  {
    term: 'PostgreSQL',
    definition: 'A powerful, open-source object-relational database system known for its reliability, robustness, and performance. Supabase uses PostgreSQL as its core database.',
    category: 'Backend/Database'
  },
  {
    term: 'Prisma',
    definition: 'A modern database toolkit for Node.js and TypeScript. It simplifies database access with an auto-generated, type-safe query builder (Prisma Client) and tools for managing database schema changes (Prisma Migrate).',
    category: 'Backend/Database'
  },
  {
    term: 'Radix UI',
    definition: 'A low-level UI component library focused on accessibility, customization, and developer experience. It provides unstyled, accessible building blocks for creating design systems and UI components (Shadcn UI is built on top of Radix).',
    category: 'Frontend'
  },
  {
    term: 'Railway',
    definition: 'A modern cloud platform that simplifies deploying applications and managing the necessary infrastructure (servers, databases) without needing deep technical expertise.',
    category: 'Deployment/Tools'
  },
  {
    term: 'Rate Limiting',
    definition: 'A technique used by servers and APIs to limit how many requests a user or application can make in a certain period, preventing overload and abuse.',
    category: 'Concepts/Backend'
  },
  {
    term: 'React',
    definition: 'A tool for building the visual parts of websites (user interfaces). It lets you create reusable blocks (components) to make complex interfaces easier to manage. Used for interactive web pages.',
    category: 'Frontend'
  },
  {
    term: 'README',
    definition: 'A file typically included with software projects that provides essential information like what the project does, how to set it up, and how to use it. Think of it as the instruction manual.',
    category: 'Concepts/Project Management'
  },
  {
    term: 'Repo (Repository)',
    definition: 'The complete collection of files and the history of changes for a project managed by Git. Often hosted on platforms like GitHub.',
    category: 'Tools/Git'
  },
  {
    term: 'Routes',
    definition: 'Definitions that map specific URL paths (like `/about` or `/users/123`) to the code or component responsible for handling that page or request in a web application.',
    category: 'Concepts/Web Development'
  },
  {
    term: 'Serverless',
    definition: 'An approach to building and running applications where the cloud provider automatically manages the server infrastructure. Developers write and deploy code without worrying about provisioning or managing servers (e.g., AWS Lambda, Supabase Functions).',
    category: 'Concepts/Backend'
  },
  {
    term: 'Shadcn UI',
    definition: 'A collection of pre-built UI components (like buttons, forms, dialogs) designed for accessibility that you can easily copy into your projects. Built using Radix UI and Tailwind CSS.',
    category: 'Frontend'
  },
  {
    term: 'SQL Query',
    definition: 'A command written in SQL (Structured Query Language) used to ask a database for specific information (e.g., \"get all users\") or to make changes to the data.',
    category: 'Backend/Database'
  },
  {
    term: 'Staging Branch',
    definition: 'A copy of the codebase (in Git) used for final testing in a production-like environment before changes are released to actual users (on the main branch).',
    category: 'Concepts/Git'
  },
  {
    term: 'Supabase',
    definition: 'An \"all-in-one\" backend service. It provides a database (PostgreSQL), user authentication, file storage, and serverless functions, making it easier to build applications without managing complex infrastructure.',
    category: 'Backend/Tools'
  },
  {
    term: 'Tailwind CSS',
    definition: 'A CSS framework that provides small utility classes (like `text-center`, `p-4`) allowing you to style web pages directly within your HTML structure without writing separate CSS files.',
    category: 'Frontend'
  },
  {
    term: 'tsconfig.json',
    definition: 'A configuration file for TypeScript projects. It specifies how the TypeScript compiler should translate TypeScript code into JavaScript and sets rules for how the code should be checked for errors.',
    category: 'Concepts/Project Structure'
  },
  {
    term: 'Types (in TypeScript)',
    definition: 'In TypeScript (a variation of JavaScript), types define what kind of data (e.g., text, number, user object) a piece of code expects, helping to catch errors early during development.',
    category: 'Concepts/Frontend'
  },
  {
    term: 'Vercel',
    definition: 'A popular platform for easily deploying and hosting websites and web applications, especially those built with modern frontend frameworks like Next.js.',
    category: 'Deployment/Tools'
  },
  {
    term: 'Version Control',
    definition: 'A system (like Git) that tracks and manages changes to files over time. It allows you to revert to previous versions, compare changes, and collaborate with others without overwriting work. Essential for managing code projects.',
    category: 'Concepts/Git'
  },
  {
    term: 'Vite',
    definition: 'A modern frontend build tool that significantly improves the development experience by providing extremely fast server startup and code updates (Hot Module Replacement). Often used with frameworks like React or Vue.',
    category: 'Tools/Frontend'
  },
  {
    term: 'Web Inspector',
    definition: 'Browser tools (like Chrome DevTools) that let you look \"under the hood\" of a website to see its HTML structure, CSS styles, and debug JavaScript code. Very useful for troubleshooting UI issues.',
    category: 'Tools/Debugging'
  }
];

export default function TerminologyPage() {
  useEffect(() => {
    document.title = 'Terminology | Cursor for Non-Coders';
  }, []);

  // Group terms by starting letter, memoized for performance
  const groupedTerms = useMemo(() => {
    const groups: { [key: string]: TermDefinition[] } = {};
    const sortedTerms = [...terminologyList].sort((a, b) => a.term.localeCompare(b.term));
    
    sortedTerms.forEach((item) => {
      const firstLetter = item.term[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(item);
    });
    return groups;
  }, []); // Dependency array is empty as terminologyList is static

  // Get sorted list of letters that have terms
  const availableLetters = Object.keys(groupedTerms).sort();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Terminology Glossary</h1>
        <p className="text-muted-foreground mb-8">
          Confused by some of the terms used in the learning platform or in web development generally? This glossary provides simple explanations for key concepts and tools.
        </p>

        {/* Alphabetical Index */}
        <div className="mb-10 p-4 bg-muted rounded-md flex flex-wrap gap-x-3 gap-y-2 justify-center">
          {availableLetters.map((letter) => (
            <a 
              key={letter} 
              href={`#${letter}`} 
              className="text-lg font-medium text-primary hover:underline px-1"
            >
              {letter}
            </a>
          ))}
        </div>

        {/* Terms List Grouped by Letter */}
        <div className="space-y-10">
          {availableLetters.map((letter) => (
            <section key={letter} id={letter} className="scroll-mt-20"> {/* scroll-mt for fixed navbar offset */}
              <h2 className="text-2xl font-bold border-b border-border pb-2 mb-4 text-primary">
                {letter}
              </h2>
              <div className="space-y-6">
                {groupedTerms[letter].map((item) => (
                  <div key={item.term} className="border-b border-border pb-4 last:border-b-0">
                    <h3 className="text-xl font-semibold text-foreground mb-1">{item.term}</h3>
                    <p className="text-foreground/90">{item.definition}</p>
                    {item.category && (
                      <span className="mt-2 inline-block bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                        Category: {item.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 