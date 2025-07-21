const TemplateManager = require('../../src/templates/templateManager');

const templateManager = new TemplateManager();

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const path = event.path.replace('/.netlify/functions/templates', '');
        
        if (event.httpMethod === 'GET') {
            if (!path || path === '/') {
                const templates = templateManager.getAllTemplates();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        templates: templates
                    })
                };
            } else if (path.startsWith('/')) {
                const format = path.substring(1);
                const templates = templateManager.getTemplatesByFormat(format);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        format: format,
                        templates: templates
                    })
                };
            }
        }

        if (event.httpMethod === 'POST' && path === '/fill') {
            const { format, templateName, values } = JSON.parse(event.body);
            
            if (!format || !templateName) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Format and template name are required'
                    })
                };
            }

            const filledTemplate = templateManager.fillTemplate(format, templateName, values);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    template: filledTemplate,
                    format: format,
                    templateName: templateName
                })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Not found'
            })
        };
        
    } catch (error) {
        console.error('Templates error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};