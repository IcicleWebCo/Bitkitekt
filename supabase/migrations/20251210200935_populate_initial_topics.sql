/*
  # Populate initial topics with color schemes

  ## Overview
  Inserts the existing hardcoded topics into the topics table with their
  original color schemes. Adjusts colors that used purple/indigo/violet
  to use alternative attractive gradients.

  ## Initial Topics
  1. React - cyan to blue (preserved)
  2. Rust - orange to red (preserved)
  3. .NET 8+ - rose to pink (adjusted from purple-pink)
  4. Blazor - fuchsia to rose (adjusted from violet-purple)
  5. Entity Framework Core - blue to sky (adjusted from blue-indigo)

  ## Notes
  - Uses INSERT with ON CONFLICT DO NOTHING to prevent duplicates
  - Maintains visual consistency with existing UI
  - All colors selected to complement the dark slate background
*/

INSERT INTO topics (name, gradient_from, gradient_to, hover_gradient_from, hover_gradient_to)
VALUES
  ('React', 'cyan-500', 'blue-500', 'cyan-400', 'blue-400'),
  ('Rust', 'orange-500', 'red-500', 'orange-400', 'red-400'),
  ('.NET 8+', 'rose-500', 'pink-500', 'rose-400', 'pink-400'),
  ('Blazor', 'fuchsia-500', 'rose-500', 'fuchsia-400', 'rose-400'),
  ('Entity Framework Core', 'blue-500', 'sky-500', 'blue-400', 'sky-400')
ON CONFLICT (name) DO NOTHING;
