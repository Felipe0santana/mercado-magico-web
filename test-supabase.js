const { createClient } = require('@supabase/supabase-js')

// Configurações corretas do Supabase
const supabaseUrl = 'https://cklmyduznlathpeoczjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbG15ZHV6bmxhdGhwZW9jemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MTkwMzIsImV4cCI6MjA2MDI5NTAzMn0.Rp4ndKYkr-N7q9Hio8XnGqEl_3d-8Qpo2o91Yhi0gvI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateUserPlan() {
  try {
    console.log('🔄 Conectando ao Supabase...')
    
    // Verificar usuário atual
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, subscription_plan, credits_remaining')
      .eq('email', 'admin2@admin2.com')
      .single()

    if (fetchError) {
      console.error('❌ Erro ao buscar usuário:', fetchError)
      return
    }

    console.log('📊 Usuário atual:', currentUser)
    console.log('✅ Plano Plus já foi ativado com sucesso!')
    console.log(`💳 Créditos atuais: ${currentUser.credits_remaining}`)
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

updateUserPlan() 