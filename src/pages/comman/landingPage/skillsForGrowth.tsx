

// This component contains just the two sections shown in the image
const CareerSkillsSections = () => {
    const careerSkills = [
        { id: 1, title: "Industry Experts", description: "Real-world learning Online from leaders in every field Present." ,icon:'Images/icons/skill.png'},
        { id: 2, title: "Free Resources", description: "Guides, tips, and eBooks to boost your career at no extra cost.",icon:'Images/icons/cloud.png' },
        { id: 3, title: "Skill-based Learning", description: "Over 600+ skill-focused courses in today’s top industries.",icon:'Images/icons/edu gears.png' },
        { id: 4, title: "Anytime, Anywhere", description: "Learn flexibly on your phone, tablet, or laptop. It just needs Some Clicks.",icon:'Images/icons/Container (4).png' },
    ];
  return (
    <>
      {/* Career Skills Section */}
      <section className="py-16 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">
            Courses Focused On Building Strong Foundational<br />
            Skills For Career Growth
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            {careerSkills.map((skill,index)=>(<div key={index} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-6 text-orange-500">
                <img src={skill.icon} alt="Skill Icon"  data-aos="fade-down" className="w-full h-full" />
              </div>
              <h3 className="text-xl font-bold mb-3">{skill.title}</h3>
              <p className="text-[#666666] text-xl font-normal font-['Barlow'] leading-[30px]">
                {skill.description}
              </p>
            </div>))}
            
          </div>
        </div>
      </section>
      
    </>
  );
};

export default CareerSkillsSections;