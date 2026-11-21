import AppKit

let directory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!

func render(_ size: Int) throws -> Data {
    let context = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8,
                            bytesPerRow: size * 4, space: colorSpace,
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    let scale = CGFloat(size) / 1024
    context.scaleBy(x: scale, y: scale)
    let tile = CGPath(roundedRect: CGRect(x: 74, y: 74, width: 876, height: 876),
                      cornerWidth: 205, cornerHeight: 205, transform: nil)
    context.saveGState()
    context.addPath(tile)
    context.clip()
    let colors = [CGColor(red: 0.37, green: 0.32, blue: 0.89, alpha: 1),
                  CGColor(red: 0.15, green: 0.12, blue: 0.42, alpha: 1)]
    let gradient = CGGradient(colorsSpace: colorSpace, colors: colors as CFArray, locations: [0, 1])!
    context.drawLinearGradient(gradient, start: CGPoint(x: 210, y: 920),
                               end: CGPoint(x: 815, y: 120), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
    context.restoreGState()

    let left = CGMutablePath()
    left.move(to: CGPoint(x: 492, y: 335))
    left.addQuadCurve(to: CGPoint(x: 282, y: 366), control: CGPoint(x: 403, y: 387))
    left.addQuadCurve(to: CGPoint(x: 244, y: 399), control: CGPoint(x: 244, y: 361))
    left.addLine(to: CGPoint(x: 244, y: 674))
    left.addQuadCurve(to: CGPoint(x: 280, y: 710), control: CGPoint(x: 244, y: 702))
    left.addQuadCurve(to: CGPoint(x: 492, y: 670), control: CGPoint(x: 403, y: 729))
    left.closeSubpath()
    let book = CGMutablePath()
    book.addPath(left)
    book.addPath(left, transform: CGAffineTransform(a: -1, b: 0, c: 0, d: 1, tx: 1024, ty: 0))
    context.setShadow(offset: CGSize(width: 0, height: -15), blur: 28,
                      color: CGColor(red: 0.06, green: 0.04, blue: 0.27, alpha: 0.45))
    context.setFillColor(CGColor(red: 1, green: 0.99, blue: 0.98, alpha: 1))
    context.addPath(book)
    context.fillPath()
    context.setShadow(offset: .zero, blur: 0)
    context.setStrokeColor(CGColor(red: 0.71, green: 0.70, blue: 0.91, alpha: 1))
    context.setLineWidth(18)
    context.setLineCap(.round)
    for y in [CGFloat(575), 519] {
        context.move(to: CGPoint(x: 306, y: y + 16))
        context.addQuadCurve(to: CGPoint(x: 430, y: y), control: CGPoint(x: 367, y: y + 22))
        context.move(to: CGPoint(x: 718, y: y + 16))
        context.addQuadCurve(to: CGPoint(x: 594, y: y), control: CGPoint(x: 657, y: y + 22))
    }
    context.strokePath()

    return NSBitmapImageRep(cgImage: context.makeImage()!).representation(using: .png, properties: [:])!
}

try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
try render(1024).write(to: directory.appendingPathComponent("icon.png"))
