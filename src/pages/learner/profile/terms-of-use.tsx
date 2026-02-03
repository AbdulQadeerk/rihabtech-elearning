import React, { useState } from 'react';
import GradientHeader from '../../../components/ui/GradientHeader';
import LearnerProfileSidebar from '../../../components/ui/LearnerProfileSidebar';

const TermsOfUse = () => {
  // You can fetch or set user info as needed, here hardcoded for consistency
  const [firstName] = useState('Manas');
  const [lastName] = useState('Agrawal');

  return (
    
          <div className="bg-white  rounded-xl px-8 py-8  ">
            <div className="font-bold text-xl mb-2 border-b-2pb-1 w-fit mb-[24px] font-barlow">Terms of Use</div>
            <div className="flex flex-col gap-6 text-[#222] font-barlow text-base">
              <div>
                <div className="font-semibold text-lg mb-2">1. Terms</div>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sed euismod justo, sit amet efficitur dui. Aliquam sodales vestibulum velit, eget sollicitudin quam. Donec non aliquam eros. Etiam sit amet lectus vel justo dignissim condimentum.</p>
                <p className="mt-2">In malesuada neque quis libero laoreet posuere. In consequat vitae ligula quis rutrum. Morbi dolor orci, maximus a pulvinar sed, bibendum ac lacus. Suspendisse in consectetur lorem. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam elementum, est sed interdum cursus, felis ex pharetra nisi, ut elementum tortor urna eu nulla. Donec rhoncus in purus quis blandit.</p>
                <p className="mt-2">Etiam eleifend metus at nunc ultricies facilisis. Morbi finibus tristique interdum. Nullam vel eleifend est, eu posuere risus. Vestibulum ligula ex, ullamcorper sit amet molestie</p>
              </div>
              <div>
                <div className="font-semibold text-lg mb-2">2. Limitations</div>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sed euismod justo, sit amet efficitur dui. Aliquam sodales vestibulum velit, eget sollicitudin quam. Donec non aliquam eros. Etiam sit amet lectus vel justo dignissim condimentum.</p>
                <p className="mt-2">In malesuada neque quis libero laoreet posuere. In consequat vitae ligula quis rutrum. Morbi dolor orci, maximus a pulvinar sed, bibendum ac lacus. Suspendisse in consectetur lorem. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam elementum, est sed interdum cursus, felis ex pharetra nisi, ut elementum tortor urna eu nulla. Donec rhoncus in purus quis blandit.</p>
                <p className="mt-2">Etiam eleifend metus at nunc ultricies facilisis. Morbi finibus tristique interdum. Nullam vel eleifend est, eu posuere risus. Vestibulum ligula ex, ullamcorper sit amet molestie</p>
              </div>
            </div>
          </div>
  );
};

export default TermsOfUse;
