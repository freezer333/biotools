import xlwt


book = xlwt.Workbook()

# add new colour to palette and set RGB colour value
xlwt.add_palette_colour("top5", 0x21)
xlwt.add_palette_colour("top25", 0x3a)
xlwt.add_palette_colour("bot25", 0x38)
xlwt.add_palette_colour("bot5", 0x2e)
book.set_colour_RGB(0x21, 250, 176, 176)
book.set_colour_RGB(0x3a, 250, 234, 176)
book.set_colour_RGB(0x38, 194, 224, 194)
book.set_colour_RGB(0x2e, 197, 223, 243)

# now you can use the colour in styles
sheet1 = book.add_sheet('Sheet 1')
style = xlwt.easyxf('pattern: pattern solid, fore_colour custom_colour')
sheet1.write(0, 0, 'Some text', style)

book.save('test.xls')