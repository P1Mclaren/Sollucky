import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          
          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Sollucky, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily access the services on Sollucky for personal, non-commercial use only. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on Sollucky</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Lottery Participation</h2>
              <p>
                By participating in our lottery system, you acknowledge that:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                <li>You are of legal age to participate in lottery activities in your jurisdiction</li>
                <li>All lottery draws are automated and transparent on the Solana blockchain</li>
                <li>Winning odds are clearly displayed for each lottery type</li>
                <li>All transactions are final and non-refundable</li>
                <li>You are responsible for the security of your wallet and private keys</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Disclaimer</h2>
              <p>
                The materials on Sollucky are provided on an 'as is' basis. Sollucky makes no warranties, expressed or implied, 
                and hereby disclaims and negates all other warranties including, without limitation, implied warranties or 
                conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property 
                or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Limitations</h2>
              <p>
                In no event shall Sollucky or its suppliers be liable for any damages (including, without limitation, damages 
                for loss of data or profit, or due to business interruption) arising out of the use or inability to use the 
                materials on Sollucky, even if Sollucky or a Sollucky authorized representative has been notified orally or 
                in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Revisions and Errata</h2>
              <p>
                The materials appearing on Sollucky could include technical, typographical, or photographic errors. 
                Sollucky does not warrant that any of the materials on its website are accurate, complete or current. 
                Sollucky may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably 
                submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through our community channels.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 bg-card/50 border border-border/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
