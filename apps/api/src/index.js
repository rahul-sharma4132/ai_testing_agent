import express from 'express';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'AI Testing Agent API' });
});
app.get('/api/v1/status', (_req, res) => {
    res.json({
        message: 'AI Testing Agent API is running',
        version: '1.0.0',
    });
});
app.listen(PORT, () => {
    console.log(`AI Testing Agent API server running on port ${PORT}`);
});
export default app;
