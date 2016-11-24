require 'json'
require 'webrick'
require 'benchmark'
require 'shellwords'

PWD = File.dirname(__FILE__)
EXAMPLE_DIR = File.expand_path('./example', PWD)
TEMPLATE_DIR = File.expand_path('./template', PWD)
SERVER_PORT = 8000

desc "Reset rwb example directory (#{EXAMPLE_DIR})"
task :reset_example do
  Benchmark.bm(30) do |x|
    Dir.chdir(PWD)
    `yarn link`

    x.report('Resetting example files...') {
      rm_rf EXAMPLE_DIR
      cp_r('lib/template', EXAMPLE_DIR)
      Dir.chdir EXAMPLE_DIR
    }

    # Create default package.json file
    x.report('Initialising modules...') {system 'yarn init -y'}

    # Modify package.json
    x.report('Updating package.json...') {
      File.open('./package.json', File::RDWR|File::CREAT, 0644) do |f|
        begin
          pkg = JSON.parse(f.read)
        rescue
          abort 'Unable to read package.json :('
        end

        pkg['description'] = 'rwb demotron'

        pkg['rwb'] = {
          :dom_node => "#.rwb-demotron",
          :main => "./MyComponent.js",
          :static_generator => "./render-static-page.js",
        }

        pkg['scripts'] = {
          :start => "rwb serve",
          :static => "RWB_DISABLE_CACHEBUSTER=true NODE_ENV=production rwb static dist",
        }

        # Write modified package.json file
        f.rewind
        f.write JSON.pretty_generate(pkg)
        f.flush
        f.truncate(f.pos)
      end
    }

    x.report('Installing packages from NPM...') {system "yarn link rwb; yarn"}
    x.report('Generating static site...') {system "npm run static"}
  end
end

task :serve do
  Dir.chdir EXAMPLE_DIR
  system "npm start"
end

task :serve_static do
  Dir.chdir File.expand_path('./dist', EXAMPLE_DIR)
  server = WEBrick::HTTPServer.new :Port => SERVER_PORT, :DocumentRoot => '.'
  trap 'INT' do server.shutdown end
  `open "http://localhost:#{SERVER_PORT}"`
  server.start
end

task :reset_and_serve => [:reset_example, :serve_static]
