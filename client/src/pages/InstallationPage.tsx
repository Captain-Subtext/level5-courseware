import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Helper to render command blocks
function CommandBlock({ command }: { command: string }) {
  return (
    <pre className="bg-muted p-3 rounded-md overflow-x-auto my-2">
      <code className="text-sm font-mono text-foreground">{command}</code>
    </pre>
  );
}

export default function InstallationPage() {
  useEffect(() => {
    document.title = 'Installation Guide | Cursor for Non-Coders';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Installation Guide</h1>
        <p className="text-muted-foreground mb-8">
          Follow these steps to set up the necessary tools on your computer to run this project locally or interact with common web development workflows.
        </p>

        <div className="space-y-8">
          {/* macOS Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">macOS Setup</CardTitle>
              <CardDescription>Using Homebrew (Recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">1. Install Homebrew (Package Manager)</h3>
                <p className="text-sm text-muted-foreground mb-1">Check if Homebrew is installed:</p>
                <CommandBlock command="brew --version" />
                <p className="text-sm text-muted-foreground mt-2">If not installed, paste the command from <a href="https://brew.sh/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">brew.sh</a> into your Terminal and follow the instructions.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Install Node.js (includes npm)</h3>
                <CommandBlock command="brew install node" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. Install Git (Version Control)</h3>
                 <p className="text-sm text-muted-foreground mb-1">Git is often pre-installed. Check with:</p>
                <CommandBlock command="git --version" />
                 <p className="text-sm text-muted-foreground mt-2">If it's not installed or you need to update:</p>
                <CommandBlock command="brew install git" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">4. (Optional) Install `tree` command</h3>
                <p className="text-sm text-muted-foreground mb-1">Useful for visualizing folder structures.</p>
                <CommandBlock command="brew install tree" />
              </div>
            </CardContent>
          </Card>

          {/* Windows Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Windows Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">1. Install Node.js (includes npm)</h3>
                <p className="text-sm text-muted-foreground mb-2">Go to <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">nodejs.org</a>, download the **LTS** version installer (`.msi`), and run it using default settings.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Install Git (Version Control)</h3>
                <p className="text-sm text-muted-foreground mb-2">Go to <a href="https://git-scm.com/download/win" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">git-scm.com</a>, download the installer, and run it. Default settings are usually fine. This installs Git and **Git Bash** (a useful terminal).</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. (Optional) Install `tree` command</h3>
                <p className="text-sm text-muted-foreground mb-1">Requires a package manager like Chocolatey.</p>
                <p className="text-sm text-muted-foreground mb-1">a. Install Chocolatey (if needed): Follow instructions at <a href="https://chocolatey.org/install" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">chocolatey.org</a> (usually requires running a PowerShell command as Administrator).</p>
                 <p className="text-sm text-muted-foreground mb-1">b. Install `tree` (using Admin PowerShell/CMD):</p>
                <CommandBlock command="choco install tree" />
                 <p className="text-xs text-muted-foreground mt-1">Alternatively, use Winget if available: `winget install tree`</p>
              </div>
              <div>
                 <h3 className="font-semibold mb-1">Alternative Package Managers</h3>
                 <p className="text-sm text-muted-foreground mb-1">You can also install Node.js and Git using Chocolatey (`choco install nodejs-lts git`) or Winget (`winget install OpenJS.NodeJS.LTS Git.Git`) if you prefer.</p>
              </div>
            </CardContent>
          </Card>

          {/* New Section: JavaScript Console */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Enable the JavaScript Console for Debugging</CardTitle>
              <CardDescription>Access developer tools in your browser to inspect issues.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Google Chrome (Desktop - Mac/Windows/Linux)</h3>
                <p className="text-sm text-muted-foreground">Usually enabled by default.</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4 mt-1">
                  <li>Right-click anywhere on the page and select "Inspect" or "Inspect Element".</li>
                  <li>Alternatively, use keyboard shortcuts: <code className="font-mono bg-muted px-1 rounded">Option + ⌘ + J</code> (Mac) or <code className="font-mono bg-muted px-1 rounded">Ctrl + Shift + J</code> (Windows/Linux).</li>
                  <li>Go to the "Console" tab within the Developer Tools panel.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Safari (macOS)</h3>
                 <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4 mt-1">
                    <li>Open Safari Preferences (<code className="font-mono bg-muted px-1 rounded">Safari &gt; Preferences.../Settings...</code> or <code className="font-mono bg-muted px-1 rounded">⌘ + ,</code>).</li>
                    <li>Go to the "Advanced" tab.</li>
                    <li>Check the box at the bottom labeled "Show features for web developers".</li>
                    <li>Close Preferences. The "Develop" menu will now appear in the menu bar.</li>
                    <li>Right-click on a page and select "Inspect Element" or use the Develop menu (<code className="font-mono bg-muted px-1 rounded">Develop &gt; Show JavaScript Console</code> or <code className="font-mono bg-muted px-1 rounded">Option + ⌘ + C</code>).</li>
                    <li>Go to the "Console" tab.</li>
                 </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Safari (iOS - iPhone/iPad)</h3>
                 <p className="text-sm text-muted-foreground mb-1">Requires an iPhone/iPad connected to your Mac via a lightning or USB-C cable.</p>
                 <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4 mt-1">
                    <li>On the iOS device: Go to <code className="font-mono bg-muted px-1 rounded">Settings &gt; Safari &gt; Advanced</code>.</li> 
                    <li>Enable "Web Inspector".</li>
                    <li>Connect the iOS device to your Mac with an appropriate cable.</li>
                    <li>On the Mac: Open Safari.</li>
                    <li>Go to the "Develop" menu (enable it first, see macOS steps above).</li>
                    <li>Find your iOS device name in the menu, hover over it, and select the specific web page you want to inspect. (Make sure you have a web page open on your iOS device.)</li>
                    <li>The Web Inspector window will open on your Mac, showing the console for the page on your iOS device.</li>
                 </ul>
              </div>
              <div>
                 <h3 className="font-semibold mb-1">Chrome (Android)</h3>
                 <p className="text-sm text-muted-foreground mb-1">Requires a computer with Chrome and a USB connection.</p>
                 <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4 mt-1">
                    <li>On the Android device: Enable Developer Options and USB Debugging. (Search online or ask the AI for specific steps for your device model, usually involves tapping the "Build number" in Settings multiple times).</li>
                    <li>Connect the Android device to your computer via USB. Open the web page you want to inspect on your Android device.</li>
                    <li>On the computer: Open Chrome.</li>
                    <li>Navigate to <code className="font-mono bg-muted px-1 rounded">chrome://inspect</code> in the address bar.</li>
                    <li>Find your connected device under the "Remote Target" section.</li>
                    <li>Click "inspect" below the specific browser tab or WebView you want to debug.</li>
                    <li>A DevTools window will open on your computer, showing the console for the page on your Android device.</li>
                    <li>You may need to accept a prompt on the Android device to allow USB debugging from your computer.</li>
                 </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 