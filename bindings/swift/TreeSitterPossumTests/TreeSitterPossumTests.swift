import XCTest
import SwiftTreeSitter
import TreeSitterPossum

final class TreeSitterPossumTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_possum())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Possum grammar")
    }
}
