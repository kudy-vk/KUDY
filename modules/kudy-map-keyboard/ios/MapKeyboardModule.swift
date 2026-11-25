import ExpoModulesCore
import UIKit

public final class MapKeyboardModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KudyMapKeyboard")
    View(MapKeyboardView.self) {
      Events("onMapKey", "onMapFocus")
      Prop("keyboardEnabled") { (view: MapKeyboardView, enabled: Bool) in
        view.keyboardEnabled = enabled
      }
    }
  }
}

// A focus environment around the existing RN accessibility target.
// No additional VoiceOver element, no global keyboard interception.
final class MapKeyboardView: ExpoView {
  let onMapKey = EventDispatcher()
  let onMapFocus = EventDispatcher()

  var keyboardEnabled = false {
    didSet {
      if !keyboardEnabled && isFirstResponder {
        resignFirstResponder()
      }
    }
  }

  override var canBecomeFocused: Bool {
    keyboardEnabled && !UIAccessibility.isVoiceOverRunning && window != nil
  }

  override var canBecomeFirstResponder: Bool {
    canBecomeFocused
  }

  private func containsFocus(_ view: UIView?) -> Bool {
    guard let view else { return false }
    return view === self || view.isDescendant(of: self)
  }

  override func didUpdateFocus(in context: UIFocusUpdateContext, with coordinator: UIFocusAnimationCoordinator) {
    super.didUpdateFocus(in: context, with: coordinator)
    let wasFocused = containsFocus(context.previouslyFocusedView)
    let nowFocused = containsFocus(context.nextFocusedView)
    if nowFocused && canBecomeFirstResponder {
      if !isFirstResponder { becomeFirstResponder() }
    } else if wasFocused && isFirstResponder {
      resignFirstResponder()
    }
  }

  override func becomeFirstResponder() -> Bool {
    let result = super.becomeFirstResponder()
    if result { onMapFocus(["focused": true]) }
    return result
  }

  override func resignFirstResponder() -> Bool {
    let wasFirst = isFirstResponder
    let result = super.resignFirstResponder()
    if wasFirst && result { onMapFocus(["focused": false]) }
    return result
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil && isFirstResponder { resignFirstResponder() }
  }

  override var keyCommands: [UIKeyCommand]? {
    guard keyboardEnabled && isFirstResponder && !UIAccessibility.isVoiceOverRunning else {
      return super.keyCommands
    }
    let inputs = [UIKeyCommand.inputLeftArrow, UIKeyCommand.inputRightArrow,
                  UIKeyCommand.inputUpArrow, UIKeyCommand.inputDownArrow,
                  "s", UIKeyCommand.inputEscape]
    let commands = inputs.map { input in
      makeCommand(input: input, modifiers: [])
    } + [makeCommand(input: "s", modifiers: .shift)]
    return (super.keyCommands ?? []) + commands
  }

  private func makeCommand(input: String, modifiers: UIKeyModifierFlags) -> UIKeyCommand {
    let command = UIKeyCommand(input: input, modifierFlags: modifiers,
                               action: #selector(handleMapKey(_:)))
    // Arrow keys normally drive the focus engine. Only the focused map
    // target overrides that behavior; Tab and activation remain system keys.
    command.wantsPriorityOverSystemBehavior = true
    return command
  }

  @objc private func handleMapKey(_ command: UIKeyCommand) {
    guard keyboardEnabled && isFirstResponder && !UIAccessibility.isVoiceOverRunning else { return }
    let key: String
    switch command.input {
    case UIKeyCommand.inputLeftArrow: key = "ArrowLeft"
    case UIKeyCommand.inputRightArrow: key = "ArrowRight"
    case UIKeyCommand.inputUpArrow: key = "ArrowUp"
    case UIKeyCommand.inputDownArrow: key = "ArrowDown"
    case UIKeyCommand.inputEscape: key = "Escape"
    case "s", "S": key = "s"
    default: return
    }
    onMapKey(["key": key])
  }
}
