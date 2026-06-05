import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://lydchdbickjympmktppy.supabase.co"

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZGNoZGJpY2tqeW1wbWt0cHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDMzNTIsImV4cCI6MjA5NjA3OTM1Mn0.FWcEWPNy8nfW8gopcjAoG4xdy8jVMHuPyvL_sILaWks"

export const supabase = createClient(supabaseUrl, supabaseKey)