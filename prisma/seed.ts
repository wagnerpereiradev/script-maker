import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes (opcional - descomente se necessário)
    // await prisma.emailScript.deleteMany();
    // await prisma.contact.deleteMany();
    // await prisma.emailTemplate.deleteMany();
    // await prisma.settings.deleteMany();

    console.log('📧 Inserindo templates padrão...');

    // Inserir templates essenciais
    await prisma.emailTemplate.createMany({
        data: [
            {
                id: 'template_cold_outreach',
                name: 'Cold Outreach Profissional',
                description: 'Template padrão para primeiro contato comercial',
                subject: 'Oportunidade para {{companyName}} - {{niche}}',
                htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
                    <div style="padding: 20px;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">Olá {{contactName}},</h2>
                        
                        <p>Espero que esteja bem. Notei que a {{companyName}} tem se destacado no setor de {{niche}}.</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
                            {{scriptBody}}
                        </div>
                        
                        <p style="font-weight: 500;">{{callToAction}}</p>
                        
                        <br>
                        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                            <p style="margin: 0;">Atenciosamente,<br>
                            <strong>{{senderName}}</strong><br>
                            {{senderTitle}}<br>
                            {{senderCompany}}</p>
                        </div>
                    </div>
                </div>`,
                category: 'cold_outreach',
                isActive: true,
            },
            {
                id: 'template_follow_up',
                name: 'Follow-up Profissional',
                description: 'Template para segundo contato ou follow-up',
                subject: 'Follow-up: {{companyName}} - {{niche}}',
                htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
                    <div style="padding: 20px;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">Oi {{contactName}},</h2>
                        
                        <p>Espero que tenha tido a chance de revisar minha mensagem anterior sobre {{niche}}.</p>
                        
                        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0;">
                            {{scriptBody}}
                        </div>
                        
                        <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb;">
                            <strong style="color: #155724;">{{callToAction}}</strong>
                        </div>
                        
                        <p>Aguardo seu retorno!</p>
                        
                        <br>
                        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                            <p style="margin: 0;">{{senderName}}<br>
                            {{senderTitle}}<br>
                            {{senderCompany}}</p>
                        </div>
                    </div>
                </div>`,
                category: 'follow_up',
                isActive: true,
            },
            {
                id: 'template_meeting',
                name: 'Agendamento de Reunião',
                description: 'Template para solicitação de reunião',
                subject: 'Convite para reunião - {{companyName}}',
                htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
                    <div style="padding: 20px;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">Prezado(a) {{contactName}},</h2>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            {{scriptBody}}
                        </div>
                        
                        <div style="border: 2px solid #007bff; padding: 20px; border-radius: 8px; margin: 20px 0; background: #f0f8ff;">
                            <h3 style="color: #007bff; margin-top: 0; display: flex; align-items: center;">
                                📅 Proposta de Reunião
                            </h3>
                            <p style="margin: 10px 0;"><strong>Duração:</strong> 30 minutos</p>
                            <p style="margin: 10px 0;"><strong>Formato:</strong> Online (Google Meet/Zoom)</p>
                            <p style="margin: 10px 0;"><strong>Objetivo:</strong> Apresentar nossa solução para {{companyName}}</p>
                        </div>
                        
                        <p style="font-weight: 500; color: #007bff;">{{callToAction}}</p>
                        
                        <br>
                        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                            <p style="margin: 0;">Atenciosamente,<br>
                            <strong>{{senderName}}</strong><br>
                            {{senderTitle}}<br>
                            {{senderCompany}}</p>
                        </div>
                    </div>
                </div>`,
                category: 'meeting_request',
                isActive: true,
            },
            {
                id: 'template_generic',
                name: 'Template Genérico',
                description: 'Template simples e reutilizável para qualquer situação',
                subject: '{{subject}}',
                htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
                    <div style="padding: 20px;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">{{greeting}}</h2>
                        
                        <div style="margin: 20px 0;">
                            {{scriptBody}}
                        </div>
                        
                        <p style="font-weight: 500; margin: 20px 0;">{{callToAction}}</p>
                        
                        <br>
                        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                            <p style="margin: 0;">{{closing}}<br>
                            <strong>{{senderName}}</strong></p>
                        </div>
                    </div>
                </div>`,
                category: 'generic',
                isActive: true,
            },
        ],
    });

    console.log('⚙️ Inserindo configurações padrão...');

    // Inserir configurações padrão
    await prisma.settings.upsert({
        where: { id: 'default_settings' },
        update: {},
        create: {
            id: 'default_settings',
            openaiModel: 'gpt-4o-mini',
            defaultTone: 'professional',
            defaultLength: 'medium',
            autoSaveScripts: true,
            smtpPort: 587,
            smtpSecure: true,
            trackEmailOpens: false,
            trackEmailClicks: false,
        },
    });

    console.log('✅ Seed concluído com sucesso!');
    console.log('📝 Templates criados: 4');
    console.log('⚙️ Configurações padrão definidas');
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('1. Configure suas variáveis de ambiente (.env.local)');
    console.log('2. Execute: npm run dev');
    console.log('3. Acesse: http://localhost:3000');
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 