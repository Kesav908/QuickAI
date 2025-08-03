import sql from "../configs/db.js";

export const getUserCreations = async (req, res) => {
    try {
        console.log("=== getUserCreations called ===");
        const { userId } = req.auth();
        console.log("User ID:", userId);
        
        const creations = await sql`
            SELECT * FROM creations 
            WHERE user_id = ${userId} 
            ORDER BY created_at DESC
        `;
        
        console.log("Found creations:", creations.length);
        res.json({ success: true, creations });
    } catch (error) {
        console.error("getUserCreations error:", error.message);
        console.error("Full error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getPublishedCreations = async (req, res) => {
    try {
        console.log("=== getPublishedCreations called ===");
        
        // First try a simple query to test database connection
        try {
            const testQuery = await sql`SELECT 1 as test`;
            console.log("Database connection test:", testQuery);
        } catch (testError) {
            console.error("Database connection failed:", testError.message);
            return res.status(500).json({ 
                success: false, 
                message: "Database connection failed: " + testError.message 
            });
        }

        // Check if creations table exists and has the required columns
        try {
            const tableInfo = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'creations'
            `;
            console.log("Creations table columns:", tableInfo);
        } catch (schemaError) {
            console.error("Schema check failed:", schemaError.message);
        }

        // Try the actual query
        console.log("Executing main query...");
        
        // SIMPLIFIED QUERY - without JOIN first
        const creations = await sql`
            SELECT * FROM creations 
            WHERE publish = true 
            ORDER BY created_at DESC
        `;
        
        console.log("Found published creations:", creations.length);
        console.log("Sample creation:", creations[0]);
        
        res.json({ success: true, creations });
        
    } catch (error) {
        console.error("=== getPublishedCreations ERROR ===");
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error detail:", error.detail);
        console.error("Full error:", error);
        
        res.status(500).json({ 
            success: false, 
            message: `Database error: ${error.message}`,
            errorCode: error.code
        });
    }
}

export const toggleLikeCreations =async (req,res)=>{
    try {
        const {userId}=req.auth()
        const {creationId}=req.body

        console.log("Received creationId:", creationId, "Type:", typeof creationId)
        console.log("User ID:", userId)

        const [creation] =await sql `SELECT * FROM creations WHERE id=${creationId}`

        console.log("Found creation:", creation ? "YES" : "NO")
        if(creation) {
            console.log("Creation ID from DB:", creation.id, "Type:", typeof creation.id)
        }

        if(!creation){
            return res.json({success:false,message:"Creation not Found"})
        }

        const currentLikes=creation.likes || []

        const userIdStr =userId.toString();
        let updatedLikes;
        let message;

        if(currentLikes.includes(userIdStr)){
            updatedLikes=currentLikes.filter((user)=>user!== userIdStr);
            message='Creation Unliked'
        }else{
            updatedLikes=[...currentLikes,userIdStr]
            message='Creation Liked'
        }

        const formattedArray=`{${updatedLikes.join(',')}}`

        await sql `UPDATE creations SET likes=${formattedArray}::text[] WHERE id=${creationId}`

        res.json({success:true,message})
    } catch (error) {
        console.error("Toggle like error:", error)
        res.json({success:false,message:error.message})
    }
}