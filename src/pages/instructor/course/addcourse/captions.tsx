import { Select } from "@radix-ui/react-select"
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { Button } from "../../../../components/ui/button"

export function CourseCaptions() {
    return (
        <div>
            <h3 className="tip mb-2">Captions</h3>
            <div className="flex items-center gap-3">
            <Select defaultValue="apple">
            <SelectTrigger className="ins-control-border rounded-none">
        <SelectValue placeholder="Choose a Language" />
      </SelectTrigger>
      <SelectContent className="bg-white">
          <SelectItem value="apple">English</SelectItem>
          <SelectItem value="banana">Add New Language</SelectItem>
        
      </SelectContent>
            </Select>
            <Button className="rounded-none">Disable</Button>
            </div>
            <div className="mb-3">

                <h4 className="tip-title ">
                0/0 published lectures captioned
                </h4>
                <p className="course-sectional-descrption">
                Learners of all levels of language proficiency highly value subtitles as it helps follow, understand and memorize the content. Also having subtitles to ensure the content is accessible for those that are deaf or hard of hearing is crucial. Learn more.
                </p>
            </div>
        </div>
    )
}