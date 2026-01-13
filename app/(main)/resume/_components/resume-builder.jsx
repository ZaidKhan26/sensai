"use client"
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertTriangle,
    Download,
    Edit,
    Loader2,
    Monitor,
    Save,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { saveResume, improveWithAI } from "@/actions/resume";
import useFetch from "@/hooks/use-fetch";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";
import { EntryForm } from "./entry-form";

export default function ResumeBuilder({ initialContent }) {

    const [activeTab, setActiveTab] = useState("edit");
    const [previewContent, setPreviewContent] = useState(initialContent);
    const [resumeMode, setResumeMode] = useState("preview");

    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            contactInfo: {},
            summary: "",
            skills: "",
            experience: [],
            education: [],
            projects: [],
        },
    });

    const {
        loading: isSaving,
        fn: saveResumeFn,
        data: saveResult,
        error: saveError,
    } = useFetch(saveResume);

    const {
        loading: isImprovingSummary,
        fn: improveWithAIFnSummary,
        data: improvedSummary,
        error: improveSummaryError,
    } = useFetch(improveWithAI);

    // Watch form fields for preview updates
    const formValues = watch();

    useEffect(() => {
        if (initialContent) {
            try {
                // Attempt to parse initialContent as JSON
                const parsedContent = JSON.parse(initialContent);
                // Convert JSON to Markdown if successful
                const markdownContent = convertJsonToMarkdown(parsedContent);
                setPreviewContent(markdownContent);
            } catch (error) {
                // If not JSON, assume it's already Markdown or a string
                setPreviewContent(initialContent);
            }
            setActiveTab("preview");
        }
    }, [initialContent]);

    // Update preview content when form values change
    useEffect(() => {
        if (activeTab === "edit") {
            const newContent = getCombinedContent();
            setPreviewContent(newContent ? newContent : "");
        }
    }, [formValues, activeTab]);

    // Handle save result
    useEffect(() => {
        if (saveResult && !isSaving) {
            toast.success("Resume saved successfully!");
        }
        if (saveError) {
            toast.error(saveError.message || "Failed to save resume");
        }
    }, [saveResult, saveError, isSaving]);

    useEffect(() => {
        if (improvedSummary && !isImprovingSummary) {
            setValue("summary", improvedSummary);
            toast.success("Summary improved successfully!");
        }
        if (improveSummaryError) {
            toast.error(improveSummaryError.message || "Failed to improve summary");
        }
    }, [improvedSummary, improveSummaryError, isImprovingSummary, setValue]);

    const handleImproveSummary = async () => {
        const summary = watch("summary");
        if (!summary) {
            toast.error("Please enter a summary first");
            return;
        }

        await improveWithAIFnSummary({
            current: summary,
            type: "summary",
        });
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.text(formValues.name, 105, 20, { align: "center" });

            let contactDetails = [];
            if (formValues.contactInfo.mobile)
                contactDetails.push(`Ph: ${formValues.contactInfo.mobile}`);
            if (formValues.contactInfo.email)
                contactDetails.push(`Email: ${formValues.contactInfo.email}`);
            if (formValues.contactInfo.linkedin)
                contactDetails.push(`LinkedIn: ${formValues.contactInfo.linkedin}`);

            if (contactDetails.length) {
                doc.setFontSize(12);
                doc.text(contactDetails.join(" | "), 105, 27, { align: "center" });
            }

            let y = 40;
            const lineHeight = 6;
            const sectionTitleFontSize = 14;
            const baseFontSize = 12;
            const descriptionFontSize = 10;


            if (formValues.summary) {
                doc.setFontSize(sectionTitleFontSize);
                doc.setFont(undefined, 'bold');
                doc.text("Professional Summary:", 10, y);
                y += lineHeight;
                doc.setFontSize(baseFontSize);
                doc.setFont(undefined, 'normal');
                const splitText = doc.splitTextToSize(formValues.summary, 180);
                splitText.forEach(line => {
                    doc.text(line, 10, y);
                    y += lineHeight;
                });
                // y += lineHeight;
                y += 2; // Reduce space before line
                doc.line(10, y, 200, y);
                // doc.line(12, y+10, 202, y+2);
                y += lineHeight;
            }

            if (formValues.skills) {
                doc.setFontSize(sectionTitleFontSize);
                doc.setFont(undefined, 'bold');
                y+=2;
                doc.text("Skills:", 10, y);
                y += lineHeight;
                doc.setFontSize(baseFontSize);
                doc.setFont(undefined, 'normal');
                const splitText = doc.splitTextToSize(formValues.skills, 180);
                splitText.forEach(line => {
                    doc.text(line, 10, y);
                    y += lineHeight;
                });
                // y += lineHeight;
                y += 2; // Reduce space before line
                doc.line(10, y, 200, y);
                y += lineHeight;
            }

            const addSection = (title, data) => {
                if (data && data.length) {
                    doc.setFontSize(sectionTitleFontSize);
                    doc.setFont(undefined, 'bold');
                    y+=2;
                    doc.text(title, 10, y);
                    y += lineHeight;
                    doc.setFontSize(baseFontSize);
                    doc.setFont(undefined, 'normal');
                    data.forEach((item, index) => {
                        const endDate = item.current ? "Present" : item.endDate;
                        const text = `${item.title} @ ${item.organization} (${item.startDate} - ${endDate})`;
                        const description = `${item.description}`;
                        const splitText = doc.splitTextToSize(text, 180);
                        splitText.forEach(line => {
                            doc.text(line, 10, y);

                            y += lineHeight;
                            // if (description) {
                            //     doc.text(`${description}`, 10, y);
                            //     y += lineHeight;
                            // }
                        });
                        doc.setFontSize(descriptionFontSize);
                        const splitDescription = doc.splitTextToSize(item.description, 180);
                        splitDescription.forEach(line => {
                            doc.text(line, 10, y);
                                y += lineHeight;
                            });
                        doc.setFontSize(baseFontSize)
                    });
                    // y += lineHeight;
                    y += 2; // Reduce space before line
                    doc.line(10, y, 200, y);
                    y += lineHeight;
                }
            };

            addSection("Experience:", formValues.experience);
            addSection("Education:", formValues.education);
            addSection("Projects:", formValues.projects);

            doc.save("resume.pdf");
        } catch (error) {
            console.error("PDF generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const getContactMarkdown = () => {
        const { contactInfo } = formValues;
        const parts = [];
        if (contactInfo.mobile) parts.push(`Ph: ${contactInfo.mobile}`);
        if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`);
        if (contactInfo.linkedin)
            parts.push(` LinkedIn: ${contactInfo.linkedin}`);

        return parts.length > 0
            ? `
\n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
            : "";
    };

    const getCombinedContent = () => {
        const { name, summary, skills, experience, education, projects } = formValues;
        return [
            name && `## <div align="center">${name}</div>`,
            getContactMarkdown(),
            summary && `## Professional Summary\n\n${summary}`,
            skills && `## Skills\n\n${skills}`,
            entriesToMarkdown(experience, "Work Experience"),
            entriesToMarkdown(education, "Education"),
            entriesToMarkdown(projects, "Projects"),
        ]
            .filter(Boolean)
            .join("\n\n");
    };


    const onSubmit = async (data) => {
        try {
            const formattedContent = previewContent
                .replace(/\n/g, "\n")
                .replace(/\n\s*\n/g, "\n\n")
                .trim();

            console.log(previewContent, formattedContent);
            await saveResumeFn(previewContent);
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    // Function to convert JSON to Markdown
    const convertJsonToMarkdown = (jsonData) => {
        console.log(jsonData);
        let markdown = "";
    
        // Name and Contact Information
        if (jsonData.name) {
            markdown += `## <div align="center">${jsonData.name}</div>\n\n`;
        }
    
        if (jsonData.contactInfo) {
            let contactParts = [];
            if (jsonData.contactInfo.mobile) {
                contactParts.push(`Ph: ${jsonData.contactInfo.mobile}`);
            }
            if (jsonData.contactInfo.email) {
                contactParts.push(`Email: ${jsonData.contactInfo.email}`);
            }
            if (jsonData.contactInfo.linkedin) {
                contactParts.push(`LinkedIn: ${jsonData.contactInfo.linkedin}`);
            }
    
            if (contactParts.length > 0) {
                markdown += `<div align="center">\n\n${contactParts.join(" | ")}\n\n</div>\n\n`;
            }
        }
    
        // Professional Summary
        if (jsonData.summary) {
            markdown += `## Professional Summary\n\n${jsonData.summary}\n\n`;
        }
    
        // Skills
        if (jsonData.skills) {
            markdown += `## Skills\n\n${jsonData.skills}\n\n`;
        }
    
        // Work Experience, Education, Projects (using entriesToMarkdown)
        if (jsonData.experience) {
            markdown += entriesToMarkdown(jsonData.experience, "Work Experience");
        }
        if (jsonData.education) {
            markdown += entriesToMarkdown(jsonData.education, "Education");
        }
        if (jsonData.projects) {
            markdown += entriesToMarkdown(jsonData.projects, "Projects");
        }
    
        return markdown;
    };


    return (
        <div data-color-mode="light" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <h1 className="font-bold gradient-title text-5xl md:text-6xl">
                    Resume Builder
                </h1>
                <div className="space-x-2">
                    <Button
                        variant="destructive"
                        onClick={onSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save
                            </>
                        )}
                    </Button>
                    <Button onClick={handleDownload} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="edit">Form</TabsTrigger>
                    <TabsTrigger value="preview">Markdown</TabsTrigger>
                </TabsList>

                <TabsContent value="edit">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input
                                        {...register("name")}
                                        type="text"
                                        placeholder="your Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        {...register("contactInfo.email")}
                                        type="email"
                                        placeholder="your@email.com"
                                        error={errors.contactInfo?.email}
                                    />
                                    {errors.contactInfo?.email && (
                                        <p className="text-sm text-red-500">
                                            {errors.contactInfo.email.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mobile Number</label>
                                    <Input
                                        {...register("contactInfo.mobile")}
                                        type="tel"
                                        placeholder="+1 234 567 8900"
                                    />
                                    {errors.contactInfo?.mobile && (
                                        <p className="text-sm text-red-500">
                                            {errors.contactInfo.mobile.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">LinkedIn Username</label>
                                    <Input
                                        {...register("contactInfo.linkedin")}
                                        type="text"
                                        placeholder="Enter LinkedIn username only"
                                    />
                                    {errors.contactInfo?.linkedin && (
                                        <p className="text-sm text-red-500">
                                            {errors.contactInfo.linkedin.message}
                                        </p>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Professional Summary</h3>
                            <Controller
                                name="summary"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        className="h-32"
                                        placeholder="Write a compelling professional summary..."
                                        error={errors.summary}
                                    />
                                )}
                            />
                            <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleImproveSummary}
                                    disabled={isImprovingSummary || !watch("summary")}
                                >
                                    {isImprovingSummary ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Improving...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Improve with AI
                                        </>
                                    )}
                                </Button>
                            {errors.summary && (
                                <p className="text-sm text-red-500">{errors.summary.message}</p>
                            )}
                        </div>

                        {/* Skills */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Skills</h3>
                            <Controller
                                name="skills"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        className="h-32"
                                        placeholder="List your key skills..."
                                        error={errors.skills}
                                    />
                                )}
                            />
                            {errors.skills && (
                                <p className="text-sm text-red-500">{errors.skills.message}</p>
                            )}
                        </div>

                        {/* Experience */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Work Experience</h3>
                            <Controller
                                name="experience"
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type="Experience"
                                        entries={field.value}
                                        onChange={(value) => {
                                            field.onChange(value);
                                        }}
                                    />
                                )}
                            />
                            {errors.experience && (
                                <p className="text-sm text-red-500">
                                    {errors.experience.message}
                                </p>
                            )}
                        </div>

                        {/* Education */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Education</h3>
                            <Controller
                                name="education"
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type="Education"
                                        entries={field.value}
                                        onChange={(value) => {
                                            field.onChange(value);
                                        }}
                                    />
                                )}
                            />
                            {errors.education && (
                                <p className="text-sm text-red-500">
                                    {errors.education.message}
                                </p>
                            )}
                        </div>

                        {/* Projects */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Projects</h3>
                            <Controller
                                name="projects"
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type="Project"
                                        entries={field.value}
                                        onChange={(value) => {
                                            field.onChange(value);
                                        }}
                                    />
                                )}
                            />
                            {errors.projects && (
                                <p className="text-sm text-red-500">
                                    {errors.projects.message}
                                </p>
                            )}
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="preview">
                    {activeTab === "preview" && (
                        <Button
                            variant="link"
                            type="button"
                            className="mb-2"
                            onClick={() =>
                                setResumeMode(resumeMode === "preview" ? "edit" : "preview")
                            }
                        >
                            {resumeMode === "preview" ? (
                                <>
                                    <Edit className="h-4 w-4" />
                                    Edit Resume
                                </>
                            ) : (
                                <>
                                    <Monitor className="h-4 w-4" />
                                    Show Preview
                                </>
                            )}
                        </Button>
                    )}

                    {activeTab === "preview" && resumeMode !== "preview" && (
                        <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="text-sm">
                                You will lose editied markdown if you update the form data.
                            </span>
                        </div>
                    )}
                    <div className="border rounded-lg">
                        <MDEditor
                            value={previewContent}
                            onChange={setPreviewContent}
                            height={800}
                            preview={resumeMode}
                        />
                    </div>
                    <div className="hidden">
                        <div id="resume-pdf">
                            <MDEditor.Markdown
                                source={previewContent}
                                style={{
                                    background: "white",
                                    color: "black",
                                }}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}