-- Add global_skill_grades table
CREATE TABLE IF NOT EXISTS public.global_skill_grades (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_skill_grades ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow public read access on global_skill_grades" 
    ON public.global_skill_grades
    FOR SELECT 
    TO public
    USING (true);

CREATE POLICY "Allow admins full access on global_skill_grades" 
    ON public.global_skill_grades
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Insert default hardcoded values if table is empty
INSERT INTO public.global_skill_grades (name)
SELECT name FROM (
    VALUES 
        ('Junior Stylist'),
        ('Senior Stylist'),
        ('Stylist Partner'),
        ('Master Barber')
) AS default_grades(name)
WHERE NOT EXISTS (
    SELECT 1 FROM public.global_skill_grades WHERE name = default_grades.name
);
