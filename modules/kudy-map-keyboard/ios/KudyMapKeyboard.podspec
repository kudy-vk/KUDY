Pod::Spec.new do |s|
  s.name = 'KudyMapKeyboard'
  s.version = '1.0.0'
  s.summary = 'KUDY map menu hardware keyboard focus adapter'
  s.description = 'Local UIKit key commands for the native map menu.'
  s.homepage = 'https://github.com/kudy-vk/KUDY'
  s.license = { :type => 'Proprietary', :file => '../../../LICENSE' }
  s.author = 'KUDY'
  s.source = { :git => 'https://github.com/kudy-vk/KUDY.git' }
  s.platform = :ios, '16.4'
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
