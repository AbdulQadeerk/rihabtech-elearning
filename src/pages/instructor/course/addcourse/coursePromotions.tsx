import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

export function CoursePromotions(){
    return(
         <div>
            <div className="mb-3">
                
        <h3 className="ins-label mb-2">Refer students</h3>
        <p className="course-sectional-descrption mb-4">
        Any time a student uses this link, we will credit you with the sale. Learn more
        </p>
                <div className="mt-8 gap-2 flex flex-col">
                    {/* <label className="ins-label">Section 1: Introduction</label> */}
                    <div className="relative w-full">
                        <Input
                            className="ins-control-border pr-28"  // give padding-right for button space
                            placeholder="Lecture 1: Introduction"
                        />
                        <Button
                            className="absolute top-1/2 -translate-y-1/2 right-1 h-[80%] rounded-none text-sm"
                            type="button"
                        >
                            Add Content
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button className="rounded-none">+ Curriculum item</Button>
                        <Button className="rounded-none">+ Add Section</Button>
                    </div>
                </div>
                <div className="mt-4 gap-2 flex flex-col">
                                    <label className="ins-label">Coupons</label>
                                    <Input
                                            className="ins-control-border"
                                            placeholder="You cannot create coupons for a free course"
                                        />
                
                                </div>
                                <div className="mt-4 gap-2 flex flex-col">
                                    <label className="ins-label">Coupons</label>
                                    <Input
                                            className="ins-control-border"
                                            placeholder="You cannot create coupons for a free course"
                                        />
                
                                </div>


                                <div className="mt-8 gap-2 flex flex-col">
                                    <div className="flex items-center justify-between">
                    <label className="ins-label">Active/Scheduled coupons</label><Button className="rounded-none">Create Multiple Coupons</Button></div>
                    <Input
                            className="ins-control-border"
                            placeholder="You cannot create coupons for a free course"
                        />

                </div>
                <div className="mt-8 gap-2 flex flex-col">
                    <label className="ins-label">Expired coupons</label>
                    <Input
                            className="ins-control-border"
                            placeholder="You cannot create coupons for a free course"
                        />

                </div>
      </div>
         </div>
    )
}