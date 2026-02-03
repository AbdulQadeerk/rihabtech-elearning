const BestEducationSections = () => {
    const cardtopic = [
        { id: 1, name: "Training Courses", description: "Boost your skills through flexible, beginner-to-advanced programs." },
        { id: 2, name: "Expert instruction", description: "Learn from professionals who bring real industry experience." },
        { id: 3, name: "Expert instruction", description: "Stay job-ready with hands-on projects and real-world applications." },
    ];
  return (
    <>
      {/* Get Best Education Section */}
      <section className="py-16 landing-gradient">
        <div className="container mx-auto px-4">
        <div className="w-full lg:w-1/2">
              <div className="mb-2">
                <span className="text-sm font-medium text-primary">Practice Advice</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Learn from the Best to Become Your Best</h2>
              {/* <p className="text-gray-600 mb-8">
                Problems trying to resolve the conflict between<br />
                the two major realms of Classical physics: Newtonian mechanics
              </p> */}
              
              
            </div>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left Column */}
            
            {/* Woman with colorful background */}
            <div className="relative">
                <img 
                  src="Images/Banners/col-md-6 (1).png" 
                  alt="Woman with notebook" 
                  className="relative z-10 mx-auto"
                />
              </div>
            
            {/* Right Column */}
            <div className="w-full lg:w-1/2">
              <h3 className="text-2xl font-bold font-['Montserrat'] leading-loose tracking-tight text-gray-800 mb-2">
                 Most Trusted in Online Learning
              </h3>
              <p className="text-gray-600 mb-6">
                 We bring industry experts and practical knowledge together to help you build real-world skills that drive results.
              </p>
              
              {/* Features List */}
              <div className="space-y-3">
                {/* Feature 1 */}
                {cardtopic.map((topic,index)=>(<div data-aos="fade-up" key={index} className="flex items-start gap-3 p-6 bg-white rounded-sm shadow-sm hover:shadow-md transition-all">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 font-semibold">
                  {topic.id}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">{topic.name}</h4>
                    <p className="text-gray-600">
                    {topic.description}
                    </p>
                  </div>
                </div>))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BestEducationSections;