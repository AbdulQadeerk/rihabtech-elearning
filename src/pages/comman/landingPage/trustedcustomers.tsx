
// This component contains just the two sections shown in the image
const TrustAndEducationSections = () => {
    const trustedCustomers = [
        { id: 1, name: "USA Football", logo: "Images/trusted customers/customer logo 6-1.jpg" },
        { id: 2, name: "PING", logo: "Images/trusted customers/customer logo 1-1.jpg" },
        { id: 3, name: "Gusto", logo: "Images/trusted customers/customer logo 1-2.jpg" },
        { id: 4, name: "Adecco Group", logo: "Images/trusted customers/customer logo 2.jpg" },
        { id: 5, name: "Zendesk", logo: "Images/trusted customers/customer logo 3.jpg" },
        { id: 6, name: "BambooHR", logo: "Images/trusted customers/customer logo 4.jpg" },
        { id: 7, name: "USA Football", logo: "Images/trusted customers/customer logo 5.jpg" },
        { id: 8, name: "BambooHR", logo: "Images/trusted customers/customer logo 4.jpg" },
        { id: 9, name: "PING", logo: "Images/trusted customers/customer logo 1-1.jpg" },
        { id: 10, name: "Gusto", logo: "Images/trusted customers/customer logo 1-2.jpg" },
    ];
  return (
    <>
      {/* Trusted Customers Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-[#000927] text-[32px] font-bold font-['Archivo'] capitalize leading-10 text-center mb-12">
            More Than 1,300 Customers Trust EDUMA
          </h2>
          
          {/* First row of logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-12">
            {trustedCustomers.map((cus,index)=>(<img key={index} data-aos="fade-Up" src={cus.logo} alt={cus.name} className="h-10 opacity-100 grayscale hover:opacity-100 hover:grayscale-0 transition-all" />))}
           
          </div>
          
        </div>
      </section>
    </>
  );
};

export default TrustAndEducationSections;