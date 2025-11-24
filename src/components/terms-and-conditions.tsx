"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TermsAndConditions() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors">
          Terms and Conditions
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4 text-sm text-muted-foreground">
          <section>
            <h3 className="font-semibold text-foreground mb-2">
              1. Acceptance of Terms
            </h3>
            <p>
              By accessing or using S3 Console ("the Service"), you agree to be
              bound by these Terms and Conditions ("Terms"). If you disagree
              with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              2. Description of Service
            </h3>
            <p>
              S3 Console provides a graphical user interface for managing Amazon
              S3 buckets and related resources. We reserve the right to modify,
              suspend, or discontinue the Service at any time, with or without
              notice.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              3. Accounts and Security
            </h3>
            <p>
              When you create an account with us, you must provide information
              that is accurate, complete, and current at all times. Failure to
              do so constitutes a breach of the Terms, which may result in
              immediate termination of your account.
            </p>
            <p className="mt-2">
              You are responsible for safeguarding the password that you use to
              access the Service and for any activities or actions under your
              password. You agree not to disclose your password to any third
              party. You must notify us immediately upon becoming aware of any
              breach of security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              4. Intellectual Property
            </h3>
            <p>
              The Service and its original content (excluding Content provided by
              users), features, and functionality are and will remain the
              exclusive property of S3 Console and its licensors. The Service is
              protected by copyright, trademark, and other laws of both the
              United States and foreign countries. Our trademarks and trade
              dress may not be used in connection with any product or service
              without the prior written consent of S3 Console.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              5. Links to Other Web Sites
            </h3>
            <p>
              Our Service may contain links to third-party web sites or services
              that are not owned or controlled by S3 Console.
            </p>
            <p className="mt-2">
              S3 Console has no control over, and assumes no responsibility for,
              the content, privacy policies, or practices of any third-party web
              sites or services. You further acknowledge and agree that S3
              Console shall not be responsible or liable, directly or
              indirectly, for any damage or loss caused or alleged to be caused
              by or in connection with use of or reliance on any such content,
              goods or services available on or through any such web sites or
              services.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              6. Termination
            </h3>
            <p>
              We may terminate or suspend your account immediately, without
              prior notice or liability, for any reason whatsoever, including
              without limitation if you breach the Terms. Upon termination, your
              right to use the Service will immediately cease. If you wish to
              terminate your account, you may simply discontinue using the
              Service.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              7. Limitation of Liability
            </h3>
            <p>
              In no event shall S3 Console, nor its directors, employees,
              partners, agents, suppliers, or affiliates, be liable for any
              indirect, incidental, special, consequential or punitive damages,
              including without limitation, loss of profits, data, use, goodwill,
              or other intangible losses, resulting from (i) your access to or
              use of or inability to access or use the Service; (ii) any conduct
              or content of any third party on the Service; (iii) any content
              obtained from the Service; and (iv) unauthorized access, use or
              alteration of your transmissions or content, whether based on
              warranty, contract, tort (including negligence) or any other legal
              theory, whether or not we have been informed of the possibility of
              such damage, and even if a remedy set forth herein is found to
              have failed of its essential purpose.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              8. Disclaimer
            </h3>
            <p>
              Your use of the Service is at your sole risk. The Service is
              provided on an "AS IS" and "AS AVAILABLE" basis. The Service is
              provided without warranties of any kind, whether express or
              implied, including, but not limited to, implied warranties of
              merchantability, fitness for a particular purpose, non-infringement
              or course of performance.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              9. Governing Law
            </h3>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of the United States, without regard to its conflict of law
              provisions.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              10. Changes
            </h3>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material we will try to
              provide at least 30 days notice prior to any new terms taking
              effect. What constitutes a material change will be determined at
              our sole discretion.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">
              11. Contact Us
            </h3>
            <p>
              If you have any questions about these Terms, please contact us at
              support@s3console.com.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
