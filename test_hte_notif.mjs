
import fetch from "node-fetch";

async function testBatch() {
    const batchData = {
        students: [
            {
                id: "TEST-001",
                name: "Test Student",
                email: "baruelo_johnlouis@plpasig.edu.ph", // Using user's email for testing
                missing_docs: ["Curriculum Vitae", "Training Agreement"]
            }
        ],
        academicYear: "2024-2025",
        semester: "2nd Semester"
    };

    const actorInfo = {
        actorName: "Antigravity Test",
        actorUserId: null
    };

    try {
        console.log("Testing batch notification endpoint...");
        const response = await fetch("http://localhost:3003/api/hte/notifications/send-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchData, actorInfo })
        });

        const result = await response.json();
        console.log("Response:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testBatch();
