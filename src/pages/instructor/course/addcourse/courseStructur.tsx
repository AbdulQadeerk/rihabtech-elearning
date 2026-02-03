import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

export function CourseStructure({onSubmit}:any){
    return(
        <div>
            <h3 className="tip mb-2">Tip</h3>
            <div className="mb-3">

                <h4 className="tip-title ">
                    Start with your goals.
                </h4>
                <p className="course-sectional-descrption">
                    Setting goals for what learners will accomplish in your course (also known as learning objectives) at the beginning will help you determine what content to include in your course and how you will teach the content to help your learners achieve the goals.
                </p>
            </div>
            <div className="mb-3">

                <h4 className="tip-title ">
                Create an outline.
                </h4>
                <p className="course-sectional-descrption">
                Decide what skills you’ll teach and how you’ll teach them. Group related lectures into sections. Each section should have at least 3 lectures, and include at least one assignment or practical activity. Learn more.
                </p>
            </div>
            <div className="mb-3">

                <h4 className="tip-title ">
                Introduce yourself and create momentum.
                </h4>
                <p className="course-sectional-descrption">
                People online want to start learning quickly. Make an introduction section that gives learners something to be excited about in the first 10 minutes.
                </p>
            </div>
            <div className="mb-3">

                <h4 className="tip-title ">
                Sections have a clear learning objective.
                </h4>
                <p className="course-sectional-descrption">
                Introduce each section by describing the section's goal and why it’s important. Give lectures and sections titles that reflect their content and have a logical flow.
                </p>
            </div>
            <div className="mb-3">

                <h4 className="tip-title ">
                Lectures cover one concept.
                </h4>
                <p className="course-sectional-descrption">
                A good lecture length is 2-7 minutes to keep students interested and help them study in short bursts. Cover a single topic in each lecture so learners can easily find and re-watch them later.
                </p>
            </div>
            <div className="mb-3">

                <h4 className="tip-title ">
                Mix and match your lecture types.
                </h4>
                <p className="course-sectional-descrption">
                Alternate between filming yourself, your screen, and slides or other visuals. Showing yourself can help learners feel connected.
Practice activities create hands-on learning.
Help learners apply your lessons to their real world with projects, assignments, coding exercises, or worksheets.
                </p>
            </div>
            <div className="mb-3">

                <h4 className="tip-title ">
                Requirements
                </h4>
                <ul className="list-disc">
                <li>See the complete list of course quality requirements</li>
                <li>Your course must have at least five lectures</li>
                <li>All lectures must add up to at least 30+ minutes of total video</li>
                <li>Your course is composed of valuable educational content and free of promotional or distracting materials</li>
                </ul>
            </div>
            <div className="flex justify-end">
          <Button type="submit" className="rounded-none" onClick={onSubmit}>
            Continue
          </Button>
        </div>
      </div>
    )
}