"""
Plantilla HTML para correos electrónicos.
"""

def get_email_template(body_content):
    """Envuelve el contenido en la plantilla de email"""
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <div style="background-color: #1E3A5F; padding: 35px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">
                    🌍 EXPEDITION
                </h1>
            </div>
            
            <div style="padding: 40px 30px; font-size: 16px; line-height: 1.6;">
                {body_content}
            </div>
            
            <div style="background-color: #f1f5f9; padding: 25px 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0;">Has recibido este mensaje porque eres parte de una aventura en Expedition.</p>
                <p style="margin: 0; font-weight: bold;">© 2026 Expedition Team</p>
            </div>
            
        </div>
    </div>
    """