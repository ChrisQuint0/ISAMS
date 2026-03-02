import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";
import { SimilarityScoreBadge } from "../components/SimilarityScoreBadge";
import { SimilarityReportModal } from "../components/SimilarityReportModal";

const DUMMY_PAPERS = [
    {
        id: "1",
        title: "Automated Crops Monitoring using IoT",
        authors: ["Christopher Quinto", "John Doe", "Kendra Wilson"],
        year: "2025",
        adviser: "Professor. Juanito Alvarez Jr., MIT",
        category: "Internet of Things",
        abstract: "The rapid evolution of Precision Agriculture (PA) demands real-time data to mitigate the risks of food insecurity and resource wastage. This paper presents an Automated Crop Monitoring System leveraging an integrated Internet of Things (IoT) architecture to provide continuous oversight of plant health and environmental conditions. Utilizing a network of wireless sensors, the system tracks critical parameters including soil moisture, ambient temperature, humidity, and NPK levels. Data is transmitted via a LoRaWAN or Wi-Fi gateway to a centralized cloud platform, where it is analyzed to trigger automated irrigation and fertilization protocols. Preliminary results demonstrate a 25% reduction in water consumption and a significant improvement in crop yield compared to traditional manual monitoring. This study concludes that the implementation of IoT-driven automation not only optimizes resource allocation but also provides farmers with actionable insights through a user-friendly Figma-designed dashboard for remote management."
    },
    {
        id: "2",
        title: "Library Management System with RFID",
        authors: ["C. Quinto", "J. Doe", "K. Wilson"],
        year: "2025",
        adviser: "Professor. Dorothy Brown, MIT",
        category: "Information Systems",
        abstract: "This research explores the integration of Radio Frequency Identification (RFID) technology into library management systems to enhance operational efficiency and security. Traditional barcode-based systems often suffer from slow checkout processes and inaccuracies in inventory management. The proposed system utilizes passive RFID tags on books and high-frequency readers at circulations desks and exit points. By automating the identification and tracking of library materials, the system facilitates rapid self-checkout, real-time inventory updates, and improved anti-theft measures. Experimental data shows a 40% reduction in average checkout time and a 95% accuracy rate in automated shelf-reading. The findings suggest that RFID technology significantly alleviates the administrative burden on library staff while providing a more seamless experience for patrons."
    },
    {
        id: "3",
        title: "AI-Powered Traffic Management System",
        authors: ["S. Smith", "M. Johnson", "R. Lee"],
        year: "2024",
        adviser: "Professor. Alan Turing, Ph.D.",
        category: "Artificial Intelligence",
        abstract: "Urban congestion remains a critical challenge for modern cities, leading to increased travel times and environmental impact. This paper introduces an AI-driven traffic management system that employs computer vision and deep learning to optimize traffic signal timings in real-time. Using live feeds from existing traffic cameras, a Convolutional Neural Network (CNN) detects vehicle density and flow patterns at intersections. This data is then processed by a Reinforcement Learning (RL) agent that dynamically adjusts signal phases to minimize cumulative delay. Simulations conducted in high-density urban scenarios indicate a 15-20% improvement in traffic throughput compared to fixed-time signal controllers. The study highlights the potential of AI to create more responsive and efficient urban infrastructure."
    }
];

export default function ThesisDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [reportModalOpen, setReportModalOpen] = useState(false);

    // Find paper by ID or default to the first one for demo purposes
    const paper = DUMMY_PAPERS.find(p => p.id === id) || DUMMY_PAPERS[0];

    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950">
            <ThesisArchivingHeader title="Digital Repository" />

            <main className="flex-1 p-0">
                {/* Beautiful Static Multi-Gradient Header */}
                <div className="relative border-b border-slate-800 bg-slate-950 px-8 py-12 md:px-12 md:py-16 overflow-hidden">
                    {/* Static Gradient Mesh Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-600 via-cyan-500 to-transparent blur-[130px] rounded-full -translate-x-1/4 -translate-y-1/4" />
                        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-purple-600 via-indigo-500 to-transparent blur-[120px] rounded-full translate-x-1/4" />
                        <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] bg-gradient-to-tr from-teal-500 via-blue-500 to-transparent blur-[140px] rounded-full translate-y-1/4" />
                    </div>

                    {/* Subtle Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

                    <div className="relative max-w-5xl mx-auto space-y-6 z-10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 -ml-2 mb-4 transition-colors backdrop-blur-sm"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>

                        <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight leading-tight drop-shadow-lg">
                            {paper.title}
                        </h1>

                        <div className="space-y-3 text-slate-300">
                            <div className="flex flex-wrap items-center gap-2 text-lg">
                                {paper.authors.map((author, index) => (
                                    <React.Fragment key={index}>
                                        <span>{author}</span>
                                        {index < paper.authors.length - 1 && <span className="text-slate-600">•</span>}
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="flex flex-col gap-1 text-sm md:text-base">
                                <p><span className="text-slate-500">Year:</span> {paper.year}</p>
                                <p><span className="text-slate-500">Adviser:</span> {paper.adviser}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            <Badge variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-200 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                                {paper.category}
                            </Badge>

                            <Button className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold gap-2 border-none shadow-lg">
                                <Download className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Abstract Section */}
                <div className="p-8 md:p-12">
                    <div className="max-w-5xl mx-auto">
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-semibold text-slate-100">Abstract</h2>
                                <div className="h-0.5 w-full bg-slate-800 mt-2" />
                            </div>

                            <p className="text-slate-300 leading-relaxed text-lg tracking-wide">
                                {paper.abstract}
                            </p>
                        </div>

                        {/* Research Integrity & Similarity Section */}
                        <div className="mt-16 space-y-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
                                        <ShieldAlert className="h-6 w-6 text-blue-400" />
                                        Research Integrity
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <SimilarityScoreBadge score={paper.similarityScore || 18} />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                                            onClick={() => setReportModalOpen(true)}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Full Report
                                        </Button>
                                    </div>
                                </div>
                                <div className="h-0.5 w-full bg-slate-800 mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <p className="text-slate-400 text-sm italic">
                                        Automated similarity analysis compares this submission against the full digital repository using NLP-based semantic matching.
                                    </p>
                                    <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Analysis Breakdown</h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: "Title Similarity", value: 5 },
                                                { label: "Abstract Similarity", value: 22 },
                                                { label: "Keywords Similarity", value: 12 },
                                            ].map((item) => (
                                                <div key={item.label} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-300">{item.label}</span>
                                                        <span className="text-slate-500">{item.value}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${item.value}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Integrity Status</h4>
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 rounded-full bg-emerald-500/10 mt-0.5">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-200">Below Threshold</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">No significant duplications detected. Verification cleared.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                                        onClick={() => console.log("Retriggering...")}
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Re-run Analysis
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SimilarityReportModal
                    open={reportModalOpen}
                    onOpenChange={setReportModalOpen}
                    submission={{ ...paper, similarityScore: paper.similarityScore || 18 }}
                />
            </main>
        </div>
    );
}