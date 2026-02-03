
import { BookOpen, Award, Star, Clock, ArrowRight, } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Button } from '../../../components/ui/button';


export default function AboutUs() {
    const testimonials = [
        {
            name: 'Sneha Patil',
            designation: 'Learner',
            testimonial: 'Flexible classes made it easy for me to learn at my own pace.The quality of teaching is truly impressive!',
            photo: null,
            initial:'SP',
            rating: 5,
        },
        {
            name: 'Omkar Deshmukh',
            designation: '',
            testimonial: 'Lifetime access lets me revisit lessons anytime I need.A perfect platform for working professionals like me.',
            photo: null,
            initial:'OD',
            rating: 5,
        },
        {
            name: 'Revati Jadhav',
            designation: 'Web Development Student',
            testimonial: 'The instructors are so supportive and clear in their guidance.I feel more confident and skilled after every',
            photo: null,
            initial:'RJ',
            rating: 5,
        },
    ];
    return (
        <div className="flex flex-col min-h-screen">


            {/* Hero Section with Orange Gradient */}
            <section className="gradient-header">
                <div className="container mx-auto">
                    <h1 className="header-title">Empowering Minds, One Course at a Time</h1>
                </div>
            </section>


            <section className="py-16 px-4 md:px-20 bg-white">
                <div className="flex flex-col-reverse md:flex-row items-center gap-12">

                    {/* LEFT Side */}
                    <div className="flex flex-col gap-4 w-full md:w-1/2 text-center md:text-left">
                        <div className="text-[#808080] text-[15px] font-medium font-['Poppins'] uppercase leading-relaxed tracking-wide">About Us</div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Learn Your Way, Grow Your Future
                            {/* <span className="text-primary">Best Quality</span> */}
                            </h2>
                        <div className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-relaxed">At <span className='font-bold'>Rihab Technologies</span>, we make learning simple and flexible. Our courses are designed to fit into your busy life — whether you want to learn online, offline, or at your own pace.
                        We work with expert instructors to bring you high-quality content and real-world skills that you can use right away.</div>

                        {/* Features List */}
                        <ul className="space-y-4 text-left">
                            <li className="flex items-center gap-2">
                                <span className="text-primary text-xl">✔</span>
                                <span className="text-gray-700 font-medium">Flexible Classes</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary text-xl">✔</span>
                                <span className="text-gray-700 font-medium">Live Chat with Instructor</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary text-xl">✔</span>
                                <span className="text-gray-700 font-medium">Help and Support from Real Industry Experts</span>
                            </li>
                        </ul>
                    </div>

                    {/* RIGHT Side */}
                    <div className="w-full md:w-1/2 relative flex justify-center">
                        {/* Background Shape (Optional) */}
                        {/* <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-100 rounded-3xl hidden md:block"></div> */}

                        {/* Main Image */}
                        <img
                            src="Images/Banners/about-11.webp.png"
                            alt="Group Photo"
                            className="rounded-lg w-80 md:w-96 relative"
                        />

                        {/* Floating Image */}
                        <img
                            src="Images/Banners/about-12.webp.png"
                            alt="Man with Laptop"
                            className="absolute -top-12 right-20 w-32 md:w-40 rounded-lg shadow-lg"
                        />
                    </div>

                </div>
            </section>


            {/* Features Section */}
            <section className="py-16 px-6 bg-white">
                <div className="container mx-auto text-center mb-16">
                    <div className="text-center justify-center text-[#808080] text-[15px] font-medium font-['Poppins'] uppercase leading-relaxed tracking-wide">WHY CHOOSE RIHAB</div>

                    <div className="text-center justify-center"><span className="text-[#181818] text-4xl font-bold font-['Spartan'] leading-[50.04px]">The Best </span><span className="text-[#181818] text-4xl font-bold font-['Spartan'] leading-[50.04px]"> Discover the Best Learning Experience</span></div>

                </div>

                <div className="container mx-auto justify-center w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Feature 1 */}
                    {[{
                        'name': 'High Quality Courses', 'description': 'Learn from courses that are carefully created by industry experts.',
                        'color': '#FFA600', 'icon': 'Images/icons/Icon.png', 'id': '1'
                    },  {
                        'name': 'Expert Instructors', 'description': 'Get real-world knowledge from Professionals with years of experience.',
                        'color': '#4664E4', 'icon': 'Images/icons/Icon-2.png', 'id': '3'
                    },
                    ].map((f, index) => (<div key={index} className="bg-white p-8 rounded-[5px] shadow-[0px_10px_30px_0px_rgba(0,0,0,0.05)] text-center hover:shadow-lg transition duration-300">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{ backgroundColor: f.color, opacity: 0.1 }}
                            ></div>
                            <img src={f.icon} alt="Feature Icon" className="w-8 h-8 relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{f.name}</h3>
                        <p className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-relaxed">{f.description}.</p>
                    </div>))}

                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-16 px-6 bg-gray-50">
            <div className="container mx-auto ">
                <div className="flex flex-col-reverse md:flex-row items-center gap-12">
                    <div className="flex flex-col gap-4 w-full md:w-1/3 text-center md:text-left">
                        <div className="text-[#808080] text-[15px] font-medium font-['Poppins'] uppercase leading-relaxed tracking-wide">TESTIMONIALS</div>
                        <h2 className="text-[#181818] text-4xl font-bold font-['Spartan'] leading-[50.04px] mb-6">What Our Students Have To Say</h2>
                        <div className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-relaxed">Our learners are at the heart of everything we do. Here’s what a few of them had to share:</div>
                        <Button className="font-medium font-[15px] w-40 py-6 items-center" onClick={() => {
        window.location.href = '/#/pricing';
      }}>Buy Plan <ArrowRight/></Button>
                    </div>

                    <div className="container mx-auto px-4">
                        <Swiper
                            slidesPerView={1.2}
                            centeredSlides={true}
                            spaceBetween={-80}
                            loop={false}
                            pagination={{ clickable: true, bulletActiveClass: 'swiper-pagination-bullet-active' }}
                            modules={[Pagination]}
                            className="overflow-x-hidden"
                            autoplay={{ disableOnInteraction: false }}
                            breakpoints={{
                                768: {
                                    slidesPerView: 2.2,
                                },
                                1024: {
                                    slidesPerView: 3,
                                }
                            }}
                        >
                            {testimonials.map((testimonial, index) => (
                                <SwiperSlide key={index} className="transition-all duration-500">
                                    {({ isActive }) => (
                                        <div className={`p-8 rounded-lg shadow-lg bg-white 
                  ${isActive ? 'scale-100 opacity-100 blur-0' : 'scale-90 opacity-50 blur-sm'}
                  transition-all duration-500`}>

                                            <div className="flex justify-left mb-4">
                                                {testimonial.photo?(<img
                                                    src={testimonial.photo}
                                                    alt={testimonial.name}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />):(
                                                    <div className='size-[70px] relative bg-neutral-300 rounded-[70px] overflow-hidden text-center uppercase justify-center flex items-center'><div className=" text-black text-[23px] font-normal font-['Poppins'] leading-relaxed">{testimonial.initial}</div></div>
                                                )}
                                            </div>

                                            <p className="text-gray-600 text-left mb-4">
                                                {testimonial.testimonial}
                                            </p>

                                            <div className="flex justify-left mb-2">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448 1.287 3.95c.3.921-.755 1.688-1.538 1.118L10 13.347l-3.37 2.448c-.783.57-1.838-.197-1.538-1.118l1.287-3.95-3.37-2.448c-.783-.57-.38-1.81.588-1.81h4.162l1.286-3.95z" />
                                                    </svg>
                                                ))}
                                            </div>

                                            <div className="text-left">
                                                <h4 className="font-bold text-lg">{testimonial.name}</h4>
                                                <p className="text-sm text-gray-400">{testimonial.designation}</p>
                                            </div>
                                        </div>
                                    )}
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
                </div>
            </section>

            {/* Stats Section with Gradient */}
            <section className="container mx-auto h-auto md:h-[460px] bg-contains bg-center flex items-center bg-no-repeat" style={{ backgroundImage: "url('Images/Banners/map-shape-3.png.png')" }}>
                
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center justify-center items-center mx-auto px-4 md:px-20">
                        {[{title:'STUDENT ENROLLED',count:'29.3k',image:'Images/icons/Overlay.png'},
                            {title:'CLASS COMPLETED',count:'32.4k',image:'Images/icons/Overlay-1.png'},
                            {title:'SATISFACTION RATE',count:'100%',image:'Images/icons/Overlay-2.png'},
                            {title:'TOP INSTRUCTORS',count:'325+',image:'Images/icons/Overlay-3.png'}
                        ].map((i,index)=>(<div key={index} className="p-12 bg-white rounded-sm shadow-[0px_30px_70px_0px_rgba(16,12,47,0.05)] flex flex-col items-center justify-center gap-3 hover:shadow-lg transition duration-300">
                            <img src={ i.image } alt="Icon" className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-4xl font-bold mb-2">{i.count}</h3>
                            <p className="text-[#181818] text-[13px] font-medium font-['Spartan'] leading-[13px]">{i.title}</p>
                        </div>))}
                    
                </div>
            </section>

        </div>
    );
}