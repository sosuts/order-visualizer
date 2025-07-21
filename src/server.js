const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const MedicalFormatParser = require('./parsers');
const TemplateManager = require('./templates/templateManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

const parser = new MedicalFormatParser();
const templateManager = new TemplateManager();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/api/parse', (req, res) => {
    try {
        const { data, format } = req.body;
        
        if (!data || data.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'No data provided for parsing'
            });
        }

        const result = parser.parse(data, format);
        const displayData = parser.formatForDisplay(result);
        
        res.json({
            success: true,
            result: result,
            displayData: displayData,
            detectedFormat: result.format
        });
        
    } catch (error) {
        console.error('Parse error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validate', (req, res) => {
    try {
        const { data, format } = req.body;
        
        if (!data || data.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'No data provided for validation'
            });
        }

        const validation = parser.validate(data, format);
        
        res.json({
            success: true,
            validation: validation
        });
        
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/samples', (req, res) => {
    try {
        const samples = parser.getSampleData();
        res.json({
            success: true,
            samples: samples
        });
    } catch (error) {
        console.error('Sample data error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/detect-format', (req, res) => {
    try {
        const { data } = req.query;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'No data provided for format detection'
            });
        }

        const format = parser.detectFormat(data);
        
        res.json({
            success: true,
            format: format
        });
        
    } catch (error) {
        console.error('Format detection error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/templates', (req, res) => {
    try {
        const templates = templateManager.getAllTemplates();
        res.json({
            success: true,
            templates: templates
        });
    } catch (error) {
        console.error('Templates error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/templates/:format', (req, res) => {
    try {
        const { format } = req.params;
        const templates = templateManager.getTemplatesByFormat(format);
        
        res.json({
            success: true,
            format: format,
            templates: templates
        });
    } catch (error) {
        console.error('Templates by format error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/templates/fill', (req, res) => {
    try {
        const { format, templateName, values } = req.body;
        
        if (!format || !templateName) {
            return res.status(400).json({
                success: false,
                error: 'Format and template name are required'
            });
        }

        const filledTemplate = templateManager.fillTemplate(format, templateName, values);
        
        res.json({
            success: true,
            template: filledTemplate,
            format: format,
            templateName: templateName
        });
    } catch (error) {
        console.error('Template fill error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/suggestions', (req, res) => {
    try {
        const { format, query } = req.query;
        
        if (!format || !query) {
            return res.status(400).json({
                success: false,
                error: 'Format and query parameters are required'
            });
        }

        const suggestions = templateManager.getFieldSuggestions(format, query);
        const commonValues = templateManager.getCommonValues();
        
        res.json({
            success: true,
            suggestions: suggestions,
            commonValues: commonValues
        });
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`Medical Order Format Editor server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});

module.exports = app;