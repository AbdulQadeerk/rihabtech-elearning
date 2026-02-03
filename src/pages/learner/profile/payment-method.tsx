import { useState } from 'react';
import GradientHeader from '../../../components/ui/GradientHeader';
import LearnerProfileSidebar from '../../../components/ui/LearnerProfileSidebar';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const ProfilePaymentMethod = () => {
  const [firstName] = useState('Manas');
  const [lastName] = useState('Agrawal');

  const formik = useFormik({
    initialValues: {
      cardHolder: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
    },
    validationSchema: Yup.object({
      cardHolder: Yup.string().required('Card Holder Name is required'),
      cardNumber: Yup.string()
        .matches(/^\d{16}$/, 'Card Number must be 16 digits')
        .required('Card Number is required'),
      expiry: Yup.string()
        .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in MM/YY format')
        .required('Expiry is required'),
      cvv: Yup.string()
        .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits')
        .required('CVV is required'),
    }),
    onSubmit: (values, { resetForm }) => {
      // Handle card save logic here
      console.log('Card saved:', values);
      resetForm();
    },
  });

  return (
   
            <div className="bg-white border border-[#E6E6E6] shadow-md flex flex-col gap-6 py-4 px-8 mt-8">
              <div className="font-semibold text-[#ff7700] text-lg mb-2 border-b-2 border-[#ff7700] pb-1 w-fit mb-[24px]">Add Card</div>
              <div className="flex gap-4 mb-2">
                <img src="/Images/icons/Visa.png" alt="Visa" className="h-7" />
                {/* <img src="/Images/icons/Mastercard.png" alt="Mastercard" className="h-7" /> */}
                {/* <img src="/Images/icons/Troy.png" alt="Troy" className="h-7" /> */}
              </div>
              <form onSubmit={formik.handleSubmit} noValidate>
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="cardHolder"
                      placeholder="Card Holder Name"
                      value={formik.values.cardHolder}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="profile-input"
                    />
                    {formik.touched.cardHolder && formik.errors.cardHolder && (
                      <div className="text-red-500 text-xs mt-1">{formik.errors.cardHolder}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number"
                      value={formik.values.cardNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="profile-input"
                    />
                    {formik.touched.cardNumber && formik.errors.cardNumber && (
                      <div className="text-red-500 text-xs mt-1">{formik.errors.cardNumber}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="expiry"
                      placeholder="MM/YY"
                      value={formik.values.expiry}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="profile-input"
                    />
                    {formik.touched.expiry && formik.errors.expiry && (
                      <div className="text-red-500 text-xs mt-1">{formik.errors.expiry}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="cvv"
                      placeholder="CVV"
                      value={formik.values.cvv}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="profile-input"
                    />
                    {formik.touched.cvv && formik.errors.cvv && (
                      <div className="text-red-500 text-xs mt-1">{formik.errors.cvv}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-[#888] mb-2">Kart bilgilerinin iyzico tarafından sonraki siparişleriniz için saklanır. Kartını iyzico uygulamadan yönetebilirsin.</div>
                <button
                  type="submit"
                  className="bg-[#ff7700] text-white py-2 px-8 font-semibold text-base hover:bg-[#e55e00] transition-colors self-start"
                >
                  Save Card
                </button>
              </form>
            </div>
  );
};

export default ProfilePaymentMethod;