

export default function Certifications() {
  const  certifications = [
        {
            id: 1,
            title: "Business",
            description: "120+ Courses",
            image: "Images/icons/Business.png",
        },
        {
            id: 2,
            title: "Design",
            description: "90+ Courses",
            image: "Images/icons/Design.png",
        },
        {
            id: 3,
            title: "Developer",
            description: "100+ Courses",
            image: "Images/icons/Developer.png",
        },
        {
            id: 4,
            title: "Health",
            description: "85+ Courses",
            image: "Images/icons/Health.png",
        },
        {
            id: 5,
            title: "IT",
            description: "16+ Courses",
            image: "Images/icons/IT.png",
        },
        
    ]
    return(
<section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-[#000927] text-[32px] section-title text-center mb-8">Top most interesting Certification</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-12">
            {certifications.map((cer,index)=>(<div  key={index}  className="bg-white p-8 rounded-none shadow-sm hover:shadow-md transition-shadow duration-300 border border-[#D4D4D4] flex flex-col items-center cursor-pointer" onClick={() => {
                    window.location.href = '/#/courselist';
                  }}>
              <div className="p-3">
                <img  data-aos="fade-up" src={cer.image} alt="Certification Icon" className="w-12 h-12" />
              </div>
              <p className="text-[#000927] text-2xl font-bold font-['Archivo'] capitalize leading-[30px] text-center ">{cer.title}</p>
              <p className="text-[#666666] text-base font-medium font-['Barlow'] leading-relaxed mt-1 text-center">{cer.description}</p>
            </div>))}
          </div>
          
         
        </div>
      </section>
)
}