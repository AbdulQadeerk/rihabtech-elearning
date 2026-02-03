import React from 'react';
// import CommanLayout from '../layout';

const termsPoints = [
  {
    title: 'Account Registration & Access',
    content: [
      'By signing up on the SimpliLearnings Website you are agreeing to be bound by the following terms and conditions (“Terms of Use”).',
      'As the original purchaser of content sold on SimpliLearnings, you are entitled to access and use the content which is identified in the course and which is on the SimpliLearnings website, at zafarkarnalkar6142.ongraphy.com ("Website"). In order to access and use this content, you must register with SimpliLearnings and create a password to use in accessing the content on the Website.',
      'Your password is unique and exclusive to you, and you may not transfer your password to any other person or allow any other person to use your password to access or use content on the Website. You agree to notify SimpliLearnings immediately if any other person makes unauthorized use of your password. SimpliLearnings reserves the right to suspend or revoke your password in the event of any misuse of your password or any use of your password in violation of these Terms and Conditions. In the event of any such suspension or revocation, you will not be entitled to any refund or payment.'
    ]
  },
  {
    title: 'Acceptance & Modification of Terms',
    content: [
      'These Terms of Use govern your access to and use of the Website and the content on the Website. By accessing and using the Website, you agree to these Terms of Use. If you do not agree to any of these Terms of Use, you may not access or use the site. SimpliLearnings reserves the right to modify these Terms of Use at any time and in its sole discretion. Your use of the site following any modification will constitute your assent to and acceptance of the modifications.'
    ]
  },
  {
    title: 'License & Usage',
    content: [
      'Upon registration, SimpliLearnings grants you a non-exclusive, non-transferable, non-assignable, personal license to access and use the SimpliLearnings content identified in the content you purchased via an online/offline reader.'
    ]
  },
  {
    title: 'Site Availability & Compatibility',
    content: [
      'SimpliLearnings will not be liable for any delay or interruption in your access to the site or any content located on the site, or for any transmission errors, equipment or software incompatibilities, force majeure or other failure of performance. SimpliLearnings will use reasonable efforts to correct any failure of performance, but SimpliLearnings will not be required to make any changes to any equipment or software used by SimpliLearnings or its contractors or agents to ensure compatibility with any equipment or software used by you. You may not use the site or the content on the site for any commercial purpose, including but not limited to the use of any of the content to market or sell goods or services to any person. You agree not to launch any automated system, including without limitation, "robots," "spiders," or "offline readers," to access the site.'
    ]
  },
  {
    title: 'Content Changes & Site Discontinuation',
    content: [
      'SimpliLearnings reserves the right to change, suspend access to, or remove any or all of the content on the Website at any time, for any reason, in its sole discretion. SimpliLearnings also reserves the right to discontinue the Website at any time, either temporarily or permanently. In the event of the removal of any content from the Website or the termination of the Website, you will not be entitled to any refund or payment.'
    ]
  },
  {
    title: 'Disclaimer & Limitation of Liability',
    content: [
      'YOU AGREE THAT YOUR USE OF THE SITE SHALL BE AT YOUR SOLE RISK, AND SimpliLearnings WILL NOT BE HELD LIABLE IN ANY WAY FOR YOUR USE OF THE SITE OR FOR ANY INFORMATION CONTAINED ON THE SITE. ALL CONTENT CONTAINED IN OR REFERRED TO ON THE SITE IS PROVIDED "AS IS," WITHOUT ANY REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, SimpliLearnings DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. SimpliLearnings MAKES NO WARRANTIES THAT THE SITE WILL BE ERROR-FREE, OR THAT ANY ERRORS WILL BE CORRECTED, OR THAT THE SITE OR THE SERVER FROM WHICH THE SITE IS OPERATED WILL BE FREE OF VIRUSES OR OTHER POTENTIALLY HARMFUL CODES. UNDER NO CIRCUMSTANCES, INCLUDING NEGLIGENCE, SHALL SimpliLearnings BE HELD LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL OR CONSEQUENTIAL DAMAGES AND EXPENSES OF ANY KIND (INCLUDING, WITHOUT LIMITATION, PERSONAL INJURY OR PROPERTY DAMAGE, LOST PROFITS, AND DAMAGES ARISING FROM COMPUTER VIRUSES, BUSINESS INTERRUPTION, LOST DATA, UNAUTHORIZED ACCESS TO OR USE OF SITE SERVERS OR ANY PERSONAL INFORMATION STORED THEREIN, OR ANY INTERRUPTION OR CESSATION OF OPERATION OF THE SITE) ARISING OUT OF OR IN ANY WAY CONNECTED WITH THE USE OF THE SITE OR ANY INFORMATION CONTAINED ON THE SITE, WHETHER SUCH DAMAGES ARE BASED ON CONTRACT, TORT, STRICT LIABILITY OR OTHERWISE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.'
    ]
  },
  {
    title: 'Indemnification',
    content: [
      'You agree to indemnify, hold harmless and defend SimpliLearnings from and against any and all claims, damages, losses, liabilities, judgments, awards, settlements, costs and expenses (including attorney\'s fees and court costs) arising out of or resulting from your use of this Website or the violation by you of any of these Terms of Use.'
    ]
  },
  {
    title: 'Limitation on Claims',
    content: [
      'YOU AGREE THAT ANY CAUSE OF ACTION ARISING OUT OF OR RELATED TO THIS SITE OR YOUR USE OF THIS SITE MUST COMMENCE WITHIN ONE (1) YEAR AFTER THE CAUSE OF ACTION ACCRUES, AND WILL THEREAFTER BE PERMANENTLY BARRED.'
    ]
  },
  {
    title: 'Entire Agreement & Severability',
    content: [
      'These Terms of Use constitute the entire agreement between you and SimpliLearnings concerning your use of the Website and the contents of the Website. If any provision is deemed invalid by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect. No waiver of any the Terms of Use shall be deemed a further or continuing waiver of such term or condition or any other term or condition, and any failure by SimpliLearnings to assert any right or provision under these Terms of Use shall not constitute a waiver of such right or provision.'
    ]
  }
];

const TermsOfUse = () => {
  return (
    // <CommanLayout>
      <section className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 text-center">Terms of <span className="text-primary">Use</span></h1>
          <p className="text-lg text-gray-700 mb-10 text-center max-w-2xl mx-auto">
            Please read these Terms of Use carefully before using the SimpliLearnings website.
          </p>
          <div className="space-y-10">
            {termsPoints.map((point, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-semibold text-[#181818] mb-3 flex items-center">
                  <span className="inline-block w-6 h-6 text-sm bg-primary rounded-full text-white flex items-center justify-center mr-2 font-bold">{idx + 1}</span>
                  {point.title}
                </h2>
                <ul className="list-disc pl-10 text-gray-700 space-y-2">
                  {point.content.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
  );
};

export default TermsOfUse; 