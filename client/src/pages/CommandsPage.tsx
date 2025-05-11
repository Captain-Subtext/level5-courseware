import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define structure for commands
interface CommandInfo {
  command: string;
  description: string;
  example?: string; // Optional example
}

interface CommandCategory {
  category: string;
  commands: CommandInfo[];
}

// List of commands
const commandList: CommandCategory[] = [
  {
    category: 'File System Navigation & Manipulation',
    commands: [
      { command: 'pwd', description: 'Print Working Directory - Shows the full path of the current folder.' },
      { command: 'ls', description: 'List - Shows files and folders in the current directory.' },
      { command: 'ls -a', description: 'Lists *all* files, including hidden ones (like `.env`, `.git`).' },
      { command: 'ls -l', description: 'Lists files in long format (permissions, owner, size, date).' },
      { command: 'cd <directory_name>', description: 'Change Directory - Moves into the specified folder.' },
      { command: 'cd ..', description: 'Moves one level up (to the parent folder).' },
      { command: 'cd ~', description: 'Moves to your home directory.' },
      { command: 'mkdir <directory_name>', description: 'Make Directory - Creates a new empty folder.' },
      { command: 'touch <file_name>', description: 'Creates a new empty file or updates modification time.' },
      { command: 'cat <file_name>', description: 'Concatenate - Displays the entire content of a file.' },
      { command: "tree -I 'node_modules|dist|.git|build' -a", description: 'Shows directory structure as a tree, ignoring common folders and showing hidden files. (*Note: `tree` might need to be installed*).' }
    ]
  },
  {
    category: 'Git Version Control',
    commands: [
      { command: 'git status', description: 'Shows the current state of your repository (changes, branch). Run this often!' },
      { command: 'git branch', description: 'Lists local branches and highlights the current one.' },
      { command: 'git checkout <branch_name>', description: 'Switches your working directory to the specified branch.' },
      { command: 'git checkout -b <new_branch_name>', description: 'Creates a *new* branch and switches to it.' },
      { command: 'git add <file_name>', description: 'Adds specific file changes to the staging area (prepares for commit).' },
      { command: 'git add .', description: 'Adds *all* modified/new files in the current directory to staging.' },
      { command: 'git commit -m "Your message"', description: 'Records staged changes to project history with a descriptive message.' },
      { command: 'git push origin <branch_name>', description: 'Uploads committed local changes to the remote repository (e.g., GitHub).' },
      { command: 'git pull origin <branch_name>', description: 'Downloads remote changes for the branch and merges them locally.' }
    ]
  },
  {
    category: 'Node.js / Project Management (NPM)',
    commands: [
      { command: 'npm install', description: 'Installs all project dependencies listed in `package.json`.' },
      { command: 'npm run dev', description: 'Runs the \"dev\" script from `package.json` (usually starts the development server).' },
      { command: 'npm run build', description: 'Runs the \"build\" script from `package.json` (usually creates a production version).' },
      { command: 'npm run dev -- --host', description: '(Vite specific) Runs dev server accessible on your local network (uses your IP).' }
    ]
  },
  {
    category: 'Networking / Utilities',
    commands: [
      { command: 'curl <URL>', description: 'Client URL - Transfers data from/to a server. Useful for testing APIs or downloading.', example: 'curl https://api.github.com/users/octocat' },
      { command: 'grep "pattern" <file>', description: 'Global Regular Expression Print - Searches for lines containing text pattern within a file.', example: 'grep "error" server.log' }
    ]
  }
];

export default function CommandsPage() {
  useEffect(() => {
    document.title = 'Terminal Commands | Cursor for Non-Coders';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Helpful Terminal Commands</h1>
        <p className="text-muted-foreground mb-8">
          A quick reference for common commands you might encounter while working with this project, Git, or Node.js.
        </p>

        <div className="space-y-8">
          {commandList.map((category) => (
            <Card key={category.category} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.commands.map((cmd) => (
                    <div key={cmd.command} className="border-b border-border pb-3 last:border-b-0">
                      <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-1">
                        <code className="text-sm font-mono text-foreground">{cmd.command}</code>
                      </pre>
                      <p className="text-sm text-muted-foreground ml-1">{cmd.description}</p>
                      {cmd.example && (
                         <p className="text-xs text-muted-foreground/80 ml-1 mt-1">
                           Example: <code className="bg-muted px-1 rounded">{cmd.example}</code>
                         </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 