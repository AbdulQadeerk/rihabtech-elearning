import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../../../components/ui/radio";

const PracticeTest = () => {
    return (
        <div className="flex flex-col gap-3">
                            <h1 className="form-title mb-3">Set Practice Paper</h1>
            <div >

                <Input className="ins-control-border" placeholder="Write your quest here"></Input>
                <div className="mt-4">
                    <RadioGroup defaultValue="option-one" className="grid grid-cols-2">
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-one" id="option-one" />
                            <label htmlFor="option-one">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-two" id="option-two" />
                            <label htmlFor="option-two">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-three" id="option-three" />
                            <label htmlFor="option-three">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-four" id="option-four" />
                            <label htmlFor="option-four">Write your Options Here and select correct Answer</label>
                        </div>
                    </RadioGroup>

                </div>

            </div>
            <hr/>
            <div >
                <Input className="ins-control-border" placeholder="Write your quest here"></Input>
                <div className="mt-4">
                    <RadioGroup defaultValue="option-one" className="grid grid-cols-2">
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-one" id="option-one" />
                            <label htmlFor="option-one">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-two" id="option-two" />
                            <label htmlFor="option-two">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-three" id="option-three" />
                            <label htmlFor="option-three">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-four" id="option-four" />
                            <label htmlFor="option-four">Write your Options Here and select correct Answer</label>
                        </div>
                    </RadioGroup>

                </div>

            </div>
            <hr/>
            <div >
                <Input className="ins-control-border" placeholder="Write your quest here"></Input>
                <div className="mt-4">
                    <RadioGroup defaultValue="option-one" className="grid grid-cols-2">
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-one" id="option-one" />
                            <label htmlFor="option-one">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-two" id="option-two" />
                            <label htmlFor="option-two">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-three" id="option-three" />
                            <label htmlFor="option-three">Write your Options Here and select correct Answer</label>
                        </div>
                        <div className="flex items-center space-x-2 ins-control-border px-2">
                            <RadioGroupItem value="option-four" id="option-four" />
                            <label htmlFor="option-four">Write your Options Here and select correct Answer</label>
                        </div>
                    </RadioGroup>

                </div>

            </div>
            <hr/>
            <div>
            <Button className="rounded-none" >+ Add Question</Button>
            </div>
        </div>
    );
};


export default PracticeTest