import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          
          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p>
                At Sollucky, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, and safeguard your information when you use our decentralized lottery platform on the Solana blockchain.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              <p>
                When you use Sollucky, we may collect the following information:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                <li><strong>Wallet Address:</strong> Your public Solana wallet address for transaction purposes</li>
                <li><strong>Transaction Data:</strong> Information about your lottery ticket purchases and winnings</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and IP address</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <p>
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                <li>To process your lottery ticket purchases and distribute winnings</li>
                <li>To maintain and improve our platform</li>
                <li>To detect and prevent fraud or unauthorized activities</li>
                <li>To communicate important updates about our service</li>
                <li>To analyze platform usage and optimize user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Blockchain Transparency</h2>
              <p>
                As a decentralized platform built on Solana, all transactions are publicly recorded on the blockchain. 
                This means:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                <li>Transaction data is permanently stored on the blockchain</li>
                <li>Anyone can view transaction history associated with wallet addresses</li>
                <li>We cannot delete or modify blockchain records</li>
                <li>Your wallet address serves as a pseudonymous identifier</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                <li>We do not store your private keys or wallet credentials</li>
                <li>All sensitive data is encrypted in transit and at rest</li>
                <li>Regular security audits and updates to our smart contracts</li>
                <li>Limited access to personal information on a need-to-know basis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Third-Party Services</h2>
              <p>
                We may use third-party services to enhance our platform:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                <li>Wallet providers (Phantom, Solflare, etc.)</li>
                <li>Analytics services to understand platform usage</li>
                <li>Infrastructure providers for hosting and performance</li>
              </ul>
              <p className="mt-4">
                These third parties have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Disconnect your wallet and stop using our services at any time</li>
                <li>Object to processing of your personal data in certain circumstances</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to improve your experience. You can control cookie 
                settings through your browser preferences. Note that disabling cookies may limit certain functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Children's Privacy</h2>
              <p>
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal 
                information from children. If you believe we have inadvertently collected such information, please 
                contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy, please contact us through our 
                community channels listed in the footer.
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
